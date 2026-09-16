using FluentValidation;

namespace Api.Features.Ratings;

public sealed class CreateRatingRequestValidator : AbstractValidator<CreateRatingRequest>
{
    public CreateRatingRequestValidator()
    {
        RuleFor(x => x.JobId).NotEmpty().WithMessage("JobId không hợp lệ.");
        RuleFor(x => x.Rate).InclusiveBetween(1, 5).WithMessage("Điểm đánh giá phải từ 1 đến 5.");
        RuleFor(x => x.Comment).MaximumLength(1000).WithMessage("Bình luận tối đa 1000 ký tự.");
    }
}
