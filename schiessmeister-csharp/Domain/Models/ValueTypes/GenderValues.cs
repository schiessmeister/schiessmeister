using System.Net;

namespace schiessmeister_csharp.Domain.Models.ValueTypes;

public sealed class GenderValues {

    public const string
        Male = "M",
        Female = "F";

    public static readonly string[] AllValues = [Male, Female];

    public static (bool valid, string gender) IsValid(string? value) {
        if (string.IsNullOrEmpty(value)) return (false, string.Empty);

        value = value.ToUpper();

        return (AllValues.Contains(value), value);
    }
}