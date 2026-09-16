namespace Api.Features.Upload;

// Shared image-upload validation + storage (task 02 `/api/upload`, task 08 `/api/me/avatar`).
// `Url` and `Error` are mutually exclusive.
public sealed record UploadSaveResult(string? Url, string? Error)
{
    public bool Succeeded => Url is not null;
}

public static class UploadStorage
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

    // Validates and stores the file under wwwroot/uploads, returning the relative url
    // (`/uploads/{guid}{ext}`) or a Vietnamese error message.
    public static async Task<UploadSaveResult> SaveImageAsync(
        IFormFile file,
        IWebHostEnvironment env,
        CancellationToken ct)
    {
        if (file.Length == 0 || file.Length > MaxFileBytes)
        {
            return new UploadSaveResult(null, "Ảnh phải nhỏ hơn 5MB.");
        }

        var extension = Path.GetExtension(file.FileName);
        if (!AllowedContentTypes.Contains(file.ContentType) || !AllowedExtensions.Contains(extension))
        {
            return new UploadSaveResult(null, "Chỉ chấp nhận ảnh jpg, jpeg, png, webp, gif.");
        }

        var name = $"{Guid.NewGuid():N}{extension.ToLowerInvariant()}";
        var uploadsRoot = Path.Combine(env.ContentRootPath, "wwwroot", "uploads");
        Directory.CreateDirectory(uploadsRoot);

        await using (var stream = File.Create(Path.Combine(uploadsRoot, name)))
        {
            await file.CopyToAsync(stream, ct);
        }

        return new UploadSaveResult($"/uploads/{name}", null);
    }
}
