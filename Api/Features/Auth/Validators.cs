using Api.Features.Jobs;
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

// Task 08: partial profile update — each rule runs only for fields present in the payload.
public sealed class UpdateProfileRequestValidator : AbstractValidator<UpdateProfileRequest>
{
    private static readonly string[] AllowedAvailability = ["all-day", "morning", "afternoon", "evening", "weekend"];
    private static readonly string[] AllowedVehicles = ["motorbike", "car", "bicycle", "none"];

    public UpdateProfileRequestValidator()
    {
        RuleFor(x => x.Name).MinimumLength(2).WithMessage("Tên phải có ít nhất 2 ký tự.").When(x => x.Name is not null);
        RuleFor(x => x.Skills).Must(skills => skills!.All(JobCategories.All.Contains)).WithMessage("Kỹ năng không hợp lệ.").When(x => x.Skills is not null);
        RuleFor(x => x.Availability).Must(value => AllowedAvailability.Contains(value)).WithMessage("Thời gian rảnh không hợp lệ.").When(x => x.Availability is not null);
        RuleFor(x => x.Vehicle).Must(value => AllowedVehicles.Contains(value)).WithMessage("Phương tiện không hợp lệ.").When(x => x.Vehicle is not null);
    }
}

// Task 08: role switch accepts only the two known roles.
public sealed class SwitchRoleRequestValidator : AbstractValidator<SwitchRoleRequest>
{
    public SwitchRoleRequestValidator()
    {
        RuleFor(x => x.Role).Must(role => role is "seeker" or "tasker").WithMessage("Vai trò không hợp lệ.");
    }
}
