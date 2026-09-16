using FluentValidation;

namespace Api.Features.Chat;

public sealed class CreateConversationRequestValidator : AbstractValidator<CreateConversationRequest>
{
    public CreateConversationRequestValidator()
    {
        RuleFor(x => x.JobId).NotEmpty().WithMessage("JobId không hợp lệ.");
    }
}

public sealed class SendMessageRequestValidator : AbstractValidator<SendMessageRequest>
{
    public SendMessageRequestValidator()
    {
        RuleFor(x => x.Body)
            .NotEmpty().WithMessage("Vui lòng nhập nội dung tin nhắn.")
            .MaximumLength(2000).WithMessage("Tin nhắn tối đa 2000 ký tự.");
    }
}
