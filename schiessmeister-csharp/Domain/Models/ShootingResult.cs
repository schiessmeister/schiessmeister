namespace schiessmeister_csharp.Domain.Models;

public class ShootingResult {
    public ShootingSeries[] Series { get; set; } = [];

    public double TotalPoints => Series.Sum(series => series.TotalPoints);
    public int TotalMisses => Series.Sum(series => series.Misses);
    public int TotalMalfunctions => Series.Sum(series => series.Malfunctions);
}

public class ShootingSeries {
    public double[] Points { get; set; } = [];
    public int Malfunctions { get; set; } = 0;
    public int Misses => Points.Count(point => point == 0);

    public double TotalPoints => Points.Sum();
}