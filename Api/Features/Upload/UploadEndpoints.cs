using Api.Features.Auth;
using Microsoft.AspNetCore.Http.HttpResults;

namespace Api.Features.Upload;

public sealed record UploadResponse(string Url);

public static class UploadEndpoints
{
    public static IEndpointRouteBuilder MapUploadEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapPost("/api/upload", UploadAsync)
            .RequireAuthorization()
            .DisableAntiforgery()
            .WithTags("Upload");

        return app;
    }

    private static async Task<Results<Ok<UploadResponse>, BadRequest<ErrorResponse>>> UploadAsync(
        IFormFile file,
        IWebHostEnvironment env,
        CancellationToken ct)
    {
        var result = await UploadStorage.SaveImageAsync(file, env, ct);

        return result.Succeeded
            ? TypedResults.Ok(new UploadResponse(result.Url!))
            : TypedResults.BadRequest(new ErrorResponse(result.Error!));
    }
}
