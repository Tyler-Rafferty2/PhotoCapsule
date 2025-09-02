package utils

// PlanLimits maps plan names to their limits
var PlanLimits = map[string]struct{
    MaxStorage int64 // in bytes
    MaxVaults  int
}{
    "free": {MaxStorage: 50 * 1024 * 1024, MaxVaults: 3}, // 50 MB
    "pro":  {MaxStorage: 10 * 1024 * 1024 * 1024, MaxVaults: 50}, // 10 GB
}