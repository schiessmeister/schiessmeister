namespace schiessmeister_csharp.Domain.Models.ValueTypes;

public static class DqStatusValues {

    public const string
        DQ = "DQ",
        DNS = "DNS",
        DNF = "DNF";

    public static readonly string[] AllValues = [DQ, DNS, DNF];

    public static (bool valid, string dqstatus) IsValid(string? value) {
        if (string.IsNullOrEmpty(value)) return (false, string.Empty);

        value = value.ToUpper();

        return (AllValues.Contains(value), value);
    }
}