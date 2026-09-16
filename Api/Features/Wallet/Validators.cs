using FluentValidation;

namespace Api.Features.Wallet;

public sealed class TopUpRequestValidator : AbstractValidator<TopUpRequest>
{
    public const decimal MaxTopUp = 100_000_000m;

    public TopUpRequestValidator()
    {
        RuleFor(x => x.Amount)
            .GreaterThan(0).WithMessage("Số tiền nạp phải lớn hơn 0.")
            .LessThanOrEqualTo(MaxTopUp).WithMessage("Số tiền nạp tối đa 100.000.000đ.");
    }
}
