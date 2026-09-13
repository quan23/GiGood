using FluentValidation;

namespace Api.Features.Auth;

public sealed class RegisterRequestValidator : AbstractValidator<RegisterRequest>
{
    public RegisterRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MinimumLength(2);
        RuleFor(x => x.Phone).NotEmpty().Matches(@"^0\d{9}$").WithMessage("Số điện thoại không hợp lệ.");
        RuleFor(x => x.Password).NotEmpty().MinimumLength(6).WithMessage("Mật khẩu phải có ít nhất 6 ký tự.");
        RuleFor(x => x.Location).NotEmpty();
        RuleFor(x => x.Role).Must(role => role is "seeker" or "tasker").WithMessage("Vai trò không hợp lệ.");

        When(x => x.Role == "tasker", () =>
        {
            RuleFor(x => x.TaskerProfile).NotNull().WithMessage("Thiếu hồ sơ tasker.");
            When(x => x.TaskerProfile is not null, () =>
            {
                RuleFor(x => x.TaskerProfile!.Skills).NotEmpty();
                RuleFor(x => x.TaskerProfile!.Bio).NotEmpty();
                RuleFor(x => x.TaskerProfile!.Availability).NotEmpty();
                RuleFor(x => x.TaskerProfile!.Vehicle).NotEmpty();
            });
        });
    }
}

public sealed class LoginRequestValidator : AbstractValidator<LoginRequest>
{
    public LoginRequestValidator()
    {
        RuleFor(x => x.Phone).NotEmpty();
        RuleFor(x => x.Password).NotEmpty();
    }
}

public sealed class TokenRequestValidator : AbstractValidator<TokenRequest>
{
    public TokenRequestValidator()
    {
        RuleFor(x => x.RefreshToken).NotEmpty();
    }
}
