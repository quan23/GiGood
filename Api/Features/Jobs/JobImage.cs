namespace Api.Features.Jobs;

// Child rows of a Job. Composite PK (JobId, Url) keeps the same upload unique per job.
public class JobImage
{
    public Guid JobId { get; set; }
    public string Url { get; set; } = string.Empty;
}
