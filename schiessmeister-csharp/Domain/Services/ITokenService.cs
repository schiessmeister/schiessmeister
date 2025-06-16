using schiessmeister_csharp.Domain.Models;
using schiessmeister_csharp.Domain.Models.Auth;

namespace schiessmeister_csharp.Domain.Services;

public interface ITokenService {

    public Task<TokenDTO> CreateTokenAsync(AppUser user);
}