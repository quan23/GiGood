using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace Api.Hubs;

// Task 05: /hubs/notifications. Server-push only — clients connect and listen for the
// `NewNotification` event (no client-invoked methods). The bearer token arrives via the
// `access_token` query (OnMessageReceived in Program.cs) and Clients.User maps to `sub`
// through SubUserIdProvider.
[Authorize]
public class NotificationHub : Hub;
