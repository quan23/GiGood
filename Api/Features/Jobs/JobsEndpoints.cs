using System.Security.Claims;
using System.Text;
using Api.Common;
using Api.Data;
using Api.Features.Auth;
using Api.Features.Escrows;
using Api.Features.Notifications;
using Api.Features.Ratings;
using Api.Features.Wallet;
using FluentValidation;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Api.Features.Jobs;

public static class JobsEndpoints
{
    private const int DefaultLimit = 20;
    private const int MaxLimit = 50;
    private const int GeoFetchCap = 200; // bbox window fetched before the in-memory Haversine sort
    private const double EarthRadiusKm = 6371.0088;

    public static IEndpointRouteBuilder MapJobsEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/jobs").RequireAuthorization();

        group.MapGet("/", ListAsync);
        group.MapPost("/", CreateAsync);
        group.MapGet("/{id:guid}", GetByIdAsync);
        group.MapPatch("/{id:guid}", UpdateAsync);
        group.MapDelete("/{id:guid}", DeleteAsync);

        // Task 06: escrow lifecycle.
        group.MapPost("/{id:guid}/accept", AcceptAsync);
        group.MapPost("/{id:guid}/report", ReportAsync);
        group.MapPost("/{id:guid}/release-escrow", ReleaseEscrowAsync);
        group.MapPost("/{id:guid}/cancel", CancelAsync);
        group.MapPost("/{id:guid}/refund", RefundAsync);

        return app;
    }

    private static async Task<Results<Ok<JobListResponse>, ValidationProblem, UnauthorizedHttpResult>> ListAsync(
        AppDbContext db,
        ClaimsPrincipal principal,
        CancellationToken ct,
        string? status = null,
        string? category = null,
        string? q = null,
        double? lat = null,
        double? lng = null,
        double? radius = null,
        string? cursor = null,
        int? limit = null,
        bool? mine = null)
    {
        JobStatus? statusFilter = null;
        if (!string.IsNullOrWhiteSpace(status))
        {
            if (!Enum.TryParse<JobStatus>(status, ignoreCase: true, out var parsed))
            {
                return ValidationError("status", "Trạng thái không hợp lệ (Open/Assigned/Done/Cancelled).");
            }

            statusFilter = parsed;
        }

        if (lat.HasValue != lng.HasValue)
        {
            return ValidationError("lat", "Cần cung cấp cả lat và lng.");
        }

        var hasGeo = lat.HasValue && lng.HasValue;
        if (hasGeo && radius.HasValue && (radius.Value <= 0 || radius.Value > 50))
        {
            return ValidationError("radius", "Bán kính phải trong khoảng 0-50km.");
        }

        var pageSize = Math.Clamp(limit ?? DefaultLimit, 1, MaxLimit);

        IQueryable<Job> query = db.Jobs.AsNoTracking().Include(j => j.Owner);

        // Task 12a: admin-hidden jobs never appear in the list/geo board (owner included).
        query = query.Where(j => !j.Hidden);

        if (mine == true)
        {
            var userId = GetUserId(principal);
            if (userId is null)
            {
                return TypedResults.Unauthorized();
            }

            var me = userId.Value;

            // Task 06: owner's own jobs + jobs where the caller is the accepted payee
            // (Held/Released) — feeds the seeker "finding" and tasker "active" lists.
            query = query.Where(j => j.OwnerId == me
                || db.Escrows.Any(e => e.JobId == j.Id && e.PayeeId == me
                    && (e.Status == EscrowStatus.Held || e.Status == EscrowStatus.Released)));
        }

        if (statusFilter is { } statusValue)
        {
            query = query.Where(j => j.Status == statusValue);
        }

        if (!string.IsNullOrWhiteSpace(category))
        {
            query = query.Where(j => j.Category == category);
        }

        if (!string.IsNullOrWhiteSpace(q))
        {
            var pattern = $"%{q.Trim()}%";
            query = query.Where(j => EF.Functions.ILike(j.Title, pattern) || EF.Functions.ILike(j.Description, pattern));
        }

        if (!string.IsNullOrWhiteSpace(cursor))
        {
            if (!TryDecodeCursor(cursor, out var cursorCreatedAt, out var cursorId))
            {
                return ValidationError("cursor", "Cursor không hợp lệ.");
            }

            query = query.Where(j =>
                j.CreatedAt < cursorCreatedAt || (j.CreatedAt == cursorCreatedAt && j.Id.CompareTo(cursorId) < 0));
        }

        if (!hasGeo)
        {
            var rows = await query
                .OrderByDescending(j => j.CreatedAt)
                .ThenByDescending(j => j.Id)
                .Take(pageSize + 1)
                .ToListAsync(ct);

            var page = rows.Take(pageSize).Select(j => ToDto(j)).ToList();
            var nextCursor = rows.Count > pageSize ? EncodeCursor(rows[pageSize - 1]) : null;
            return TypedResults.Ok(new JobListResponse(page, nextCursor));
        }

        // Geo: bbox prefilter in SQL (Haversine does not translate), then exact
        // distance filter + Haversine sort in memory. Cursor pagination is applied
        // before the distance sort, so geo pages do not hand out a next cursor.
        var radiusKm = radius ?? 5;
        var centerLat = lat!.Value;
        var centerLng = lng!.Value;
        var latDelta = radiusKm / 111.32;
        var lngDelta = radiusKm / (111.32 * Math.Max(Math.Cos(ToRadians(centerLat)), 0.01));

        query = query.Where(j =>
            j.Lat != null && j.Lng != null
            && j.Lat >= centerLat - latDelta && j.Lat <= centerLat + latDelta
            && j.Lng >= centerLng - lngDelta && j.Lng <= centerLng + lngDelta);

        var candidates = await query
            .OrderByDescending(j => j.CreatedAt)
            .ThenByDescending(j => j.Id)
            .Take(GeoFetchCap)
            .ToListAsync(ct);

        var jobs = candidates
            .Select(j => (Job: j, DistanceKm: HaversineKm(centerLat, centerLng, j.Lat!.Value, j.Lng!.Value)))
            .Where(x => x.DistanceKm <= radiusKm)
            .OrderBy(x => x.DistanceKm)
            .ThenByDescending(x => x.Job.CreatedAt)
            .ThenByDescending(x => x.Job.Id)
            .Take(pageSize)
            .Select(x => ToDto(x.Job, Math.Round(x.DistanceKm, 2)))
            .ToList();

        return TypedResults.Ok(new JobListResponse(jobs, NextCursor: null));
    }

    private static async Task<Results<Created<JobDto>, ValidationProblem, UnauthorizedHttpResult>> CreateAsync(
        CreateJobRequest request,
        IValidator<CreateJobRequest> validator,
        ClaimsPrincipal principal,
        AppDbContext db,
        NotificationService notifications,
        CancellationToken ct)
    {
        var validation = await validator.ValidateAsync(request, ct);
        if (!validation.IsValid)
        {
            return TypedResults.ValidationProblem(validation.ToDictionary());
        }

        var userId = GetUserId(principal);
        if (userId is null)
        {
            return TypedResults.Unauthorized();
        }

        var owner = await db.Users.SingleOrDefaultAsync(u => u.Id == userId, ct);
        if (owner is null)
        {
            return TypedResults.Unauthorized();
        }

        var job = new Job
        {
            Id = GuidV7.NewGuid(),
            OwnerId = owner.Id,
            Owner = owner,
            Title = request.Title.Trim(),
            Description = request.Description.Trim(),
            Category = request.Category,
            Price = request.Price,
            Status = JobStatus.Open,
            Lat = request.Lat,
            Lng = request.Lng,
            LocationText = request.LocationText?.Trim(),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            Images = request.Images?.Select(url => new JobImage { Url = url }).ToList() ?? [],
        };

        db.Jobs.Add(job);
        await db.SaveChangesAsync(ct);

        // Task 05: announce the new job to seekers (owner excluded), capped. Post-commit
        // + best-effort.
        await notifications.NotifyNewJobAsync(db, job, ct);

        return TypedResults.Created($"/api/jobs/{job.Id}", ToDto(job));
    }

    private static async Task<Results<Ok<JobDto>, NotFound<ErrorResponse>>> GetByIdAsync(
        Guid id,
        AppDbContext db,
        CancellationToken ct)
    {
        var job = await db.Jobs.AsNoTracking()
            .Include(j => j.Owner)
            .Include(j => j.Images)
            .SingleOrDefaultAsync(j => j.Id == id, ct);

        return job is null
            ? TypedResults.NotFound(new ErrorResponse("Không tìm thấy công việc."))
            : TypedResults.Ok(ToDto(job));
    }

    private static async Task<Results<Ok<JobDto>, ValidationProblem, NotFound<ErrorResponse>, ProblemHttpResult, UnauthorizedHttpResult>> UpdateAsync(
        Guid id,
        UpdateJobRequest request,
        IValidator<UpdateJobRequest> validator,
        ClaimsPrincipal principal,
        AppDbContext db,
        CancellationToken ct)
    {
        var validation = await validator.ValidateAsync(request, ct);
        if (!validation.IsValid)
        {
            return TypedResults.ValidationProblem(validation.ToDictionary());
        }

        var userId = GetUserId(principal);
        if (userId is null)
        {
            return TypedResults.Unauthorized();
        }

        var job = await db.Jobs
            .Include(j => j.Owner)
            .Include(j => j.Images)
            .SingleOrDefaultAsync(j => j.Id == id, ct);
        if (job is null)
        {
            return TypedResults.NotFound(new ErrorResponse("Không tìm thấy công việc."));
        }

        if (job.OwnerId != userId)
        {
            return TypedResults.Problem(statusCode: StatusCodes.Status403Forbidden, detail: "Bạn không phải chủ công việc.");
        }

        if (request.Title is not null)
        {
            job.Title = request.Title.Trim();
        }

        if (request.Description is not null)
        {
            job.Description = request.Description.Trim();
        }

        if (request.Category is not null)
        {
            job.Category = request.Category;
        }

        if (request.Price.HasValue)
        {
            job.Price = request.Price.Value;
        }

        if (request.LocationText is not null)
        {
            job.LocationText = request.LocationText.Trim();
        }

        if (request.Lat.HasValue)
        {
            job.Lat = request.Lat;
        }

        if (request.Lng.HasValue)
        {
            job.Lng = request.Lng;
        }

        job.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);

        return TypedResults.Ok(ToDto(job));
    }

    private static async Task<Results<NoContent, NotFound<ErrorResponse>, Conflict<ErrorResponse>, ProblemHttpResult, UnauthorizedHttpResult>> DeleteAsync(
        Guid id,
        ClaimsPrincipal principal,
        AppDbContext db,
        CancellationToken ct)
    {
        var userId = GetUserId(principal);
        if (userId is null)
        {
            return TypedResults.Unauthorized();
        }

        var job = await db.Jobs.SingleOrDefaultAsync(j => j.Id == id, ct);
        if (job is null)
        {
            return TypedResults.NotFound(new ErrorResponse("Không tìm thấy công việc."));
        }

        if (job.OwnerId != userId)
        {
            return TypedResults.Problem(statusCode: StatusCodes.Status403Forbidden, detail: "Bạn không phải chủ công việc.");
        }

        // Task 06: money is held — the owner must cancel (refund) before deleting.
        if (await db.Escrows.AnyAsync(e => e.JobId == id && e.Status == EscrowStatus.Held, ct))
        {
            return TypedResults.Conflict(new ErrorResponse("Công việc đang có ký quỹ, hãy hủy trước khi xóa."));
        }

        db.Jobs.Remove(job);
        await db.SaveChangesAsync(ct);

        return TypedResults.NoContent();
    }

    // Task 06: single-winner accept. Opens one transaction, holds the owner's escrow,
    // debits the payer wallet, writes the Hold ledger row + JobApplications row and
    // flips the job to Assigned. Reuses a Refunded escrow row on re-accept.
    private static async Task<Results<Ok<JobEscrowResponse>, BadRequest<ErrorResponse>, NotFound<ErrorResponse>, Conflict<ErrorResponse>, ProblemHttpResult, UnauthorizedHttpResult>> AcceptAsync(
        Guid id,
        ClaimsPrincipal principal,
        AppDbContext db,
        NotificationService notifications,
        CancellationToken ct)
    {
        var userId = GetUserId(principal);
        if (userId is null)
        {
            return TypedResults.Unauthorized();
        }

        await using var tx = await db.Database.BeginTransactionAsync(ct);

        try
        {
            var job = await db.Jobs.SingleOrDefaultAsync(j => j.Id == id, ct);
            if (job is null)
            {
                return TypedResults.NotFound(new ErrorResponse("Không tìm thấy công việc."));
            }

            if (job.OwnerId == userId)
            {
                return TypedResults.Problem(statusCode: StatusCodes.Status403Forbidden, detail: "Bạn không thể nhận việc của chính mình.");
            }

            if (job.Status != JobStatus.Open)
            {
                return TypedResults.Conflict(new ErrorResponse("Công việc đã có người nhận hoặc không còn mở."));
            }

            var ownerWallet = await db.Wallets.SingleOrDefaultAsync(w => w.UserId == job.OwnerId, ct);
            if (ownerWallet is null)
            {
                return TypedResults.Conflict(new ErrorResponse("Ví của người đăng việc không tồn tại."));
            }

            // Balance gate BEFORE any writes.
            if (ownerWallet.Balance < job.Price)
            {
                return TypedResults.BadRequest(new ErrorResponse("Số dư ví của người đăng không đủ để ký quỹ."));
            }

            var escrow = await db.Escrows.SingleOrDefaultAsync(e => e.JobId == job.Id, ct);
            var now = DateTime.UtcNow;

            if (escrow is null)
            {
                escrow = new Escrow
                {
                    Id = GuidV7.NewGuid(),
                    JobId = job.Id,
                    PayerId = job.OwnerId,
                    PayeeId = userId.Value,
                    Amount = job.Price,
                    Status = EscrowStatus.Held,
                    HeldAt = now,
                };
                db.Escrows.Add(escrow);
            }
            else
            {
                // Unique Escrows(JobId) allows re-accept only after a refund.
                if (escrow.Status != EscrowStatus.Refunded)
                {
                    return TypedResults.Conflict(new ErrorResponse("Công việc đã có người nhận."));
                }

                escrow.PayerId = job.OwnerId;
                escrow.PayeeId = userId.Value;
                escrow.Amount = job.Price;
                escrow.Status = EscrowStatus.Held;
                escrow.HeldAt = now;
                escrow.ReleasedAt = null;
            }

            ownerWallet.Balance -= job.Price;
            db.WalletTransactions.Add(new WalletTransaction
            {
                Id = GuidV7.NewGuid(),
                UserId = job.OwnerId,
                Type = WalletTransactionType.Hold,
                Amount = -job.Price,
                RefJobId = job.Id,
                CreatedAt = now,
            });

            var application = await db.JobApplications
                .SingleOrDefaultAsync(a => a.JobId == job.Id && a.WorkerId == userId.Value, ct);
            if (application is null)
            {
                db.JobApplications.Add(new JobApplication
                {
                    JobId = job.Id,
                    WorkerId = userId.Value,
                    Status = "Accepted",
                    CreatedAt = now,
                });
            }
            else
            {
                application.Status = "Accepted";
                application.CreatedAt = now;
            }

            job.Status = JobStatus.Assigned;
            job.UpdatedAt = now;

            await db.SaveChangesAsync(ct);
            await tx.CommitAsync(ct);

            // Task 05: tell the owner who accepted (post-commit, best-effort).
            var taskerName = await db.Users.AsNoTracking()
                .Where(u => u.Id == userId.Value)
                .Select(u => u.Name)
                .SingleOrDefaultAsync(ct) ?? "Người nhận việc";

            await notifications.CreateAndSendAsync(
                db,
                job.OwnerId,
                NotificationTypes.JobMatched,
                "Có người nhận việc",
                $"{taskerName} đã nhận \"{job.Title}\"",
                job.Id,
                ct);

            return TypedResults.Ok(new JobEscrowResponse(EscrowDto.From(escrow), ownerWallet.Balance));
        }
        catch (DbUpdateConcurrencyException)
        {
            return Conflict("Công việc vừa được người khác nhận. Vui lòng thử lại.");
        }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation })
        {
            // Unique Escrows(JobId): the other concurrent accept won.
            return Conflict("Công việc vừa được người khác nhận.");
        }
    }

    // Task 06: the payee marks work as done; the owner then releases or cancels.
    private static async Task<Results<NoContent, NotFound<ErrorResponse>, Conflict<ErrorResponse>, ProblemHttpResult, UnauthorizedHttpResult>> ReportAsync(
        Guid id,
        ClaimsPrincipal principal,
        AppDbContext db,
        NotificationService notifications,
        CancellationToken ct)
    {
        var userId = GetUserId(principal);
        if (userId is null)
        {
            return TypedResults.Unauthorized();
        }

        var job = await db.Jobs.SingleOrDefaultAsync(j => j.Id == id, ct);
        if (job is null)
        {
            return TypedResults.NotFound(new ErrorResponse("Không tìm thấy công việc."));
        }

        var isPayee = await db.Escrows.AsNoTracking().AnyAsync(
            e => e.JobId == id && e.PayeeId == userId && e.Status == EscrowStatus.Held, ct);
        if (!isPayee || job.Status != JobStatus.Assigned)
        {
            return TypedResults.Problem(statusCode: StatusCodes.Status403Forbidden, detail: "Bạn không phải người nhận việc của công việc này.");
        }

        if (job.IsCompletedReported)
        {
            return TypedResults.NoContent(); // idempotent
        }

        job.IsCompletedReported = true;
        job.UpdatedAt = DateTime.UtcNow;

        try
        {
            await db.SaveChangesAsync(ct);
        }
        catch (DbUpdateConcurrencyException)
        {
            return Conflict("Công việc vừa được cập nhật, vui lòng thử lại.");
        }

        // Task 05: tell the owner the tasker reported completion (post-commit, best-effort).
        var taskerName = await db.Users.AsNoTracking()
            .Where(u => u.Id == userId.Value)
            .Select(u => u.Name)
            .SingleOrDefaultAsync(ct) ?? "Người nhận việc";

        await notifications.CreateAndSendAsync(
            db,
            job.OwnerId,
            NotificationTypes.JobMatched,
            "Tasker báo hoàn thành",
            $"{taskerName} đã báo hoàn thành \"{job.Title}\"",
            job.Id,
            ct);

        return TypedResults.NoContent();
    }

    // Task 06: payer confirms completion -> escrow Released + payee credited + job Done.
    // Task 07: an optional `{rating?, comment?}` body creates a review (payer rates payee).
    // Task 12a: the ledger transition lives in EscrowLedgerService (shared with admin).
    private static async Task<Results<Ok<JobEscrowResponse>, NotFound<ErrorResponse>, Conflict<ErrorResponse>, ProblemHttpResult, UnauthorizedHttpResult>> ReleaseEscrowAsync(
        Guid id,
        ReleaseEscrowRequest? request,
        ClaimsPrincipal principal,
        AppDbContext db,
        EscrowLedgerService ledger,
        NotificationService notifications,
        ReviewService reviews,
        CancellationToken ct)
    {
        var userId = GetUserId(principal);
        if (userId is null)
        {
            return TypedResults.Unauthorized();
        }

        var job = await db.Jobs.AsNoTracking().SingleOrDefaultAsync(j => j.Id == id, ct);
        if (job is null)
        {
            return TypedResults.NotFound(new ErrorResponse("Không tìm thấy công việc."));
        }

        var escrow = await db.Escrows.AsNoTracking().SingleOrDefaultAsync(e => e.JobId == id, ct);
        if (escrow is null)
        {
            return TypedResults.Conflict(new ErrorResponse("Công việc chưa có ký quỹ."));
        }

        if (escrow.PayerId != userId)
        {
            return TypedResults.Problem(statusCode: StatusCodes.Status403Forbidden, detail: "Bạn không phải người trả tiền của công việc này.");
        }

        var result = await ledger.ReleaseAsync(db, escrow.Id, ct);
        if (!result.Succeeded)
        {
            if (result.NotFound)
            {
                return TypedResults.NotFound(new ErrorResponse(result.Error!));
            }

            return TypedResults.Conflict(new ErrorResponse(result.Error!));
        }

        var releasedEscrow = result.Escrow!;
        var releasedJob = result.Job!;

        // Task 05: tell the payee the escrow was released (post-commit, best-effort).
        await notifications.CreateAndSendAsync(
            db,
            releasedEscrow.PayeeId,
            NotificationTypes.EscrowReleased,
            "Đã giải ngân",
            $"Bạn nhận được {NotificationService.FormatVnd(releasedEscrow.Amount)} cho \"{releasedJob.Title}\"",
            releasedJob.Id,
            ct);

        // Task 07: optional rating -> review from the payer to the payee. Best-effort:
        // the release already committed, so a bad/duplicate rating only logs a warning.
        await reviews.TryCreateAsync(db, releasedJob.Id, userId.Value, request?.Rating, request?.Comment, ct);

        return TypedResults.Ok(new JobEscrowResponse(EscrowDto.From(releasedEscrow), result.Balance));
    }

    // Task 06: owner cancels. Open -> Cancelled (no ledger); Assigned & not reported ->
    // refund the Held escrow to the payer and set Cancelled.
    private static async Task<Results<Ok<JobEscrowResponse>, NoContent, NotFound<ErrorResponse>, Conflict<ErrorResponse>, ProblemHttpResult, UnauthorizedHttpResult>> CancelAsync(
        Guid id,
        ClaimsPrincipal principal,
        AppDbContext db,
        NotificationService notifications,
        CancellationToken ct)
    {
        var userId = GetUserId(principal);
        if (userId is null)
        {
            return TypedResults.Unauthorized();
        }

        await using var tx = await db.Database.BeginTransactionAsync(ct);

        try
        {
            var job = await db.Jobs.SingleOrDefaultAsync(j => j.Id == id, ct);
            if (job is null)
            {
                return TypedResults.NotFound(new ErrorResponse("Không tìm thấy công việc."));
            }

            if (job.OwnerId != userId)
            {
                return TypedResults.Problem(statusCode: StatusCodes.Status403Forbidden, detail: "Bạn không phải chủ công việc.");
            }

            if (job.Status == JobStatus.Cancelled)
            {
                return TypedResults.NoContent(); // idempotent
            }

            if (job.Status == JobStatus.Done)
            {
                return TypedResults.Conflict(new ErrorResponse("Công việc đã hoàn thành, không thể hủy."));
            }

            if (job.Status == JobStatus.Assigned && job.IsCompletedReported)
            {
                return TypedResults.Conflict(new ErrorResponse("Người nhận việc đã báo hoàn thành, hãy giải ngân thay vì hủy."));
            }

            var escrow = await db.Escrows.SingleOrDefaultAsync(e => e.JobId == id, ct);
            var now = DateTime.UtcNow;

            if (escrow is { Status: EscrowStatus.Held })
            {
                var payerWallet = await db.Wallets.SingleOrDefaultAsync(w => w.UserId == escrow.PayerId, ct);
                if (payerWallet is null)
                {
                    return TypedResults.Conflict(new ErrorResponse("Ví của bạn không tồn tại."));
                }

                payerWallet.Balance += escrow.Amount;
                db.WalletTransactions.Add(new WalletTransaction
                {
                    Id = GuidV7.NewGuid(),
                    UserId = escrow.PayerId,
                    Type = WalletTransactionType.Refund,
                    Amount = escrow.Amount,
                    RefJobId = job.Id,
                    CreatedAt = now,
                });

                escrow.Status = EscrowStatus.Refunded;
                escrow.ReleasedAt = now;
                job.Status = JobStatus.Cancelled;
                job.UpdatedAt = now;

                await db.SaveChangesAsync(ct);
                await tx.CommitAsync(ct);

                // Task 05: owner cancelled — tell the payee (post-commit, best-effort).
                await notifications.CreateAndSendAsync(
                    db,
                    escrow.PayeeId,
                    NotificationTypes.EscrowReleased,
                    "Việc đã huỷ",
                    $"\"{job.Title}\" đã bị huỷ. Khoản {NotificationService.FormatVnd(escrow.Amount)} đã được hoàn lại cho người đăng.",
                    job.Id,
                    ct);

                return TypedResults.Ok(new JobEscrowResponse(EscrowDto.From(escrow), payerWallet.Balance));
            }

            job.Status = JobStatus.Cancelled;
            job.UpdatedAt = now;
            await db.SaveChangesAsync(ct);
            await tx.CommitAsync(ct);

            return TypedResults.NoContent();
        }
        catch (DbUpdateConcurrencyException)
        {
            return Conflict("Công việc vừa được cập nhật, vui lòng thử lại.");
        }
    }

    // Task 06: payee abandons a Held escrow. Same refund path as cancel but the job
    // goes back to the board (Open) instead of Cancelled.
    // Task 12a: the ledger transition lives in EscrowLedgerService (shared with admin).
    private static async Task<Results<Ok<JobEscrowResponse>, NotFound<ErrorResponse>, Conflict<ErrorResponse>, ProblemHttpResult, UnauthorizedHttpResult>> RefundAsync(
        Guid id,
        ClaimsPrincipal principal,
        AppDbContext db,
        EscrowLedgerService ledger,
        NotificationService notifications,
        CancellationToken ct)
    {
        var userId = GetUserId(principal);
        if (userId is null)
        {
            return TypedResults.Unauthorized();
        }

        var job = await db.Jobs.AsNoTracking().SingleOrDefaultAsync(j => j.Id == id, ct);
        if (job is null)
        {
            return TypedResults.NotFound(new ErrorResponse("Không tìm thấy công việc."));
        }

        var escrow = await db.Escrows.AsNoTracking().SingleOrDefaultAsync(e => e.JobId == id, ct);
        if (escrow is null || escrow.Status != EscrowStatus.Held)
        {
            return TypedResults.Conflict(new ErrorResponse("Khoản ký quỹ không còn đang được giữ."));
        }

        if (escrow.PayeeId != userId)
        {
            return TypedResults.Problem(statusCode: StatusCodes.Status403Forbidden, detail: "Bạn không phải người nhận việc của công việc này.");
        }

        var result = await ledger.RefundAsync(db, escrow.Id, ct);
        if (!result.Succeeded)
        {
            if (result.NotFound)
            {
                return TypedResults.NotFound(new ErrorResponse(result.Error!));
            }

            return TypedResults.Conflict(new ErrorResponse(result.Error!));
        }

        var refundedJob = result.Job!;

        // Task 05: payee abandoned — tell the payer (post-commit, best-effort).
        var taskerName = await db.Users.AsNoTracking()
            .Where(u => u.Id == userId.Value)
            .Select(u => u.Name)
            .SingleOrDefaultAsync(ct) ?? "Người nhận việc";

        await notifications.CreateAndSendAsync(
            db,
            result.Escrow!.PayerId,
            NotificationTypes.EscrowReleased,
            "Đã hoàn tiền",
            $"{taskerName} đã huỷ nhận \"{refundedJob.Title}\". Bạn được hoàn {NotificationService.FormatVnd(result.Escrow.Amount)} vào ví.",
            refundedJob.Id,
            ct);

        return TypedResults.Ok(new JobEscrowResponse(EscrowDto.From(result.Escrow), result.Balance));
    }

    private static Conflict<ErrorResponse> Conflict(string message) => TypedResults.Conflict(new ErrorResponse(message));

    private static JobDto ToDto(Job job, double? distanceKm = null) => new(
        job.Id,
        new JobOwnerDto(job.Owner.Id, job.Owner.Name, job.Owner.AvatarUrl, job.Owner.RatingAvg),
        job.Title,
        job.Description,
        job.Category,
        job.Price,
        job.Status.ToString(),
        job.IsCompletedReported,
        job.Lat,
        job.Lng,
        distanceKm,
        job.LocationText,
        job.Images.Select(image => image.Url).ToList(),
        job.CreatedAt,
        job.UpdatedAt);

    // Inbound claim mapping may rename `sub`; same reading as AuthEndpoints.
    private static Guid? GetUserId(ClaimsPrincipal principal)
    {
        var raw = principal.FindFirstValue("sub") ?? principal.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(raw, out var id) ? id : null;
    }

    private static ValidationProblem ValidationError(string field, string message) =>
        TypedResults.ValidationProblem(new Dictionary<string, string[]> { [field] = [message] });

    private static string EncodeCursor(Job job) =>
        Base64UrlEncode(Encoding.UTF8.GetBytes($"{job.CreatedAt.Ticks}|{job.Id:N}"));

    private static bool TryDecodeCursor(string raw, out DateTime createdAt, out Guid id)
    {
        createdAt = default;
        id = default;

        try
        {
            var base64 = raw.Replace('-', '+').Replace('_', '/');
            base64 = base64.PadRight(base64.Length + (4 - base64.Length % 4) % 4, '=');
            var parts = Encoding.UTF8.GetString(Convert.FromBase64String(base64)).Split('|');

            if (parts.Length != 2 || !long.TryParse(parts[0], out var ticks) || !Guid.TryParseExact(parts[1], "N", out id))
            {
                return false;
            }

            createdAt = new DateTime(ticks, DateTimeKind.Utc);
            return true;
        }
        catch (FormatException)
        {
            return false;
        }
    }

    private static string Base64UrlEncode(byte[] bytes) =>
        Convert.ToBase64String(bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_');

    private static double ToRadians(double degrees) => degrees * Math.PI / 180;

    private static double HaversineKm(double lat1, double lng1, double lat2, double lng2)
    {
        var dLat = ToRadians(lat2 - lat1);
        var dLng = ToRadians(lng2 - lng1);
        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2)
            + Math.Cos(ToRadians(lat1)) * Math.Cos(ToRadians(lat2)) * Math.Sin(dLng / 2) * Math.Sin(dLng / 2);
        return EarthRadiusKm * 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
    }
}
