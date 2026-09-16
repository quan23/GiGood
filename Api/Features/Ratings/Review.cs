using Api.Common;
using Api.Features.Auth;
using Api.Features.Jobs;

namespace Api.Features.Ratings;

// Task 07: one review per (JobId, ReviewerId). The reviewee is implicit — the job's
// other participant (owner + escrow payee). Rate is CHECK 1..5.
public class Review
{
    public Guid Id { get; set; } = GuidV7.NewGuid();
    public Guid JobId { get; set; }
    public Guid ReviewerId { get; set; }
    public int Rate { get; set; }
    public string? Comment { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Job Job { get; set; } = null!;
    public User Reviewer { get; set; } = null!;
}
