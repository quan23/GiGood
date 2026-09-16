using Api.Features.Auth;
using Api.Features.Jobs;

namespace Api.Features.Ratings;

// Task 07: `rate` 1..5, comment optional (max 1000).
public sealed record CreateRatingRequest(Guid JobId, int Rate, string? Comment);

public sealed record RatingJobDto(Guid Id, string Title);

public sealed record RatingUserDto(Guid Id, string Name, string? AvatarUrl);

// `revieweeId` is implicit in the DB (the job's other participant) and resolved per row.
public sealed record ReviewDto(
    Guid Id,
    Guid JobId,
    RatingJobDto Job,
    RatingUserDto Reviewer,
    Guid RevieweeId,
    int Rate,
    string? Comment,
    DateTime CreatedAt)
{
    public static ReviewDto From(Review review, Job job, User reviewer, Guid revieweeId) => new(
        review.Id,
        review.JobId,
        new RatingJobDto(job.Id, job.Title),
        new RatingUserDto(reviewer.Id, reviewer.Name, reviewer.AvatarUrl),
        revieweeId,
        review.Rate,
        review.Comment,
        review.CreatedAt);
}

public sealed record ReviewListResponse(List<ReviewDto> Reviews, string? NextCursor, double Avg);

public sealed record UserRatingResponse(double Avg, int Count, int JobsDone);
