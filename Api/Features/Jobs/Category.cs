namespace Api.Features.Jobs;

// Static category lookup (task 02), seeded by JobSeed when the table is empty.
// `Key` is the value stored on Job.Category.
public class Category
{
    public int Id { get; set; }
    public string Key { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public string Icon { get; set; } = string.Empty;
}

// Category keys accepted by create/patch validation.
public static class JobCategories
{
    public static readonly string[] All = ["repair", "cleaning", "delivery", "helper"];
}
