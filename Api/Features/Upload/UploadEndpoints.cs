using Api.Features.Auth;
using Microsoft.AspNetCore.Http.HttpResults;

namespace Api.Features.Upload;

public sealed record UploadResponse(string Url);

public static class UploadEndpoints
{
    private const long MaxFileBytes = 5 * 1024 * 1024;

    private static readonly HashSet<string> AllowedContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg", "image/png", "image/webp", "image/gif",
    };

    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg", ".jpeg", ".png", ".webp", ".gif",
    };

    public static IEndpointRouteBuilder MapUploadEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapPost("/api/upload", UploadAsync)
            .RequireAuthorization()
            .DisableAntiforgery();

        return app;
    }

    private static async Task<Results<Ok<UploadResponse>, BadRequest<ErrorResponse>>> UploadAsync(
        IFormFile file,
        IWebHostEnvironment env,
        CancellationToken ct)
    {
        if (file.Length == 0 || file.Length > MaxFileBytes)
        {
            return TypedResults.BadRequest(new ErrorResponse("Ảnh phải nhỏ hơn 5MB."));
        }

        var extension = Path.GetExtension(file.FileName);
        if (!AllowedContentTypes.Contains(file.ContentType) || !AllowedExtensions.Contains(extension))
        {
            return TypedResults.BadRequest(new ErrorResponse("Chỉ chấp nhận ảnh jpg, jpeg, png, webp, gif."));
        }

        var name = $"{Guid.NewGuid():N}{extension.ToLowerInvariant()}";
        var uploadsRoot = Path.Combine(env.ContentRootPath, "wwwroot", "uploads");
        Directory.CreateDirectory(uploadsRoot);

        await using (var stream = File.Create(Path.Combine(uploadsRoot, name)))
        {
            await file.CopyToAsync(stream, ct);
        }

        return TypedResults.Ok(new UploadResponse($"/uploads/{name}"));
    }
}
