using System.Security.Claims;
using Microsoft.AspNetCore.SignalR;

namespace Api.Hubs;

// Task 05: makes `IHubContext<NotificationHub>.Clients.User(userId)` work. The default
// provider uses the NameIdentifier claim; the tokens here carry `sub` (Guid string), so
// read that first (fallback NameIdentifier mirrors the REST GetUserId helpers).
public sealed class SubUserIdProvider : IUserIdProvider
{
    public string? GetUserId(HubConnectionContext connection)
    {
        return connection.User?.FindFirstValue("sub") ?? connection.User?.FindFirstValue(ClaimTypes.NameIdentifier);
    }
}
