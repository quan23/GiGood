using Api.Features.Auth;

namespace Api.Features.Jobs;

// Task 06: one row per tasker/job application; the accept flow upserts the
// (JobId, WorkerId) row with Status "Accepted".
public class JobApplication
{
    public Guid JobId { get; set; }
    public Guid WorkerId { get; set; }
    public decimal? Offer { get; set; }
    public string Status { get; set; } = "Accepted";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Job Job { get; set; } = null!;
    public User Worker { get; set; } = null!;
}
