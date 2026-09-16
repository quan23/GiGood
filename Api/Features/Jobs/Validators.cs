using FluentValidation;

namespace Api.Features.Jobs;

public sealed class CreateJobRequestValidator : AbstractValidator<CreateJobRequest>
{
    public CreateJobRequestValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MinimumLength(5).WithMessage("Tiêu đề phải có ít nhất 5 ký tự.");
        RuleFor(x => x.Description).NotEmpty().WithMessage("Vui lòng nhập mô tả.");
        RuleFor(x => x.Category).Must(category => JobCategories.All.Contains(category)).WithMessage("Danh mục không hợp lệ.");
        RuleFor(x => x.Price).GreaterThanOrEqualTo(10000).WithMessage("Ngân sách tối thiểu 10.000đ.");
        RuleFor(x => x.Lat).InclusiveBetween(-90, 90).When(x => x.Lat.HasValue);
        RuleFor(x => x.Lng).InclusiveBetween(-180, 180).When(x => x.Lng.HasValue);
        RuleFor(x => x.Images).Must(images => images is null || images.Count <= 5).WithMessage("Tối đa 5 ảnh.");
        RuleForEach(x => x.Images).Must(IsUploadUrl).WithMessage("Ảnh phải là URL tải lên hợp lệ.");
    }

    private static bool IsUploadUrl(string url) =>
        !string.IsNullOrWhiteSpace(url)
        && url.StartsWith("/uploads/", StringComparison.Ordinal)
        && !url.Contains("..", StringComparison.Ordinal);
}

// Partial update: every constraint re-runs only for fields present in the payload.
public sealed class UpdateJobRequestValidator : AbstractValidator<UpdateJobRequest>
{
    public UpdateJobRequestValidator()
    {
        RuleFor(x => x.Title).MinimumLength(5).WithMessage("Tiêu đề phải có ít nhất 5 ký tự.").When(x => x.Title is not null);
        RuleFor(x => x.Description).NotEmpty().WithMessage("Vui lòng nhập mô tả.").When(x => x.Description is not null);
        RuleFor(x => x.Category).Must(category => JobCategories.All.Contains(category)).WithMessage("Danh mục không hợp lệ.").When(x => x.Category is not null);
        RuleFor(x => x.Price).GreaterThanOrEqualTo(10000).WithMessage("Ngân sách tối thiểu 10.000đ.").When(x => x.Price.HasValue);
        RuleFor(x => x.Lat).InclusiveBetween(-90, 90).When(x => x.Lat.HasValue);
        RuleFor(x => x.Lng).InclusiveBetween(-180, 180).When(x => x.Lng.HasValue);
    }
}
