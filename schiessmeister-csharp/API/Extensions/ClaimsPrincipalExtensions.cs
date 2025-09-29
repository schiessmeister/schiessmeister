using System.Security.Claims;

namespace schiessmeister_csharp.API.Extensions;

public static class ClaimsPrincipalExtensions {

    public static int GetUserId(this ClaimsPrincipal principal) {
        if (principal == null)
            throw new ArgumentNullException(nameof(principal));

        var claim = principal.FindFirst(ClaimTypes.NameIdentifier);
        if (claim == null)
            throw new InvalidOperationException("User ID claim not found");

        return int.Parse(claim.Value);
    }
}