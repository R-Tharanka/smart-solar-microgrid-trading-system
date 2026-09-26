// -----------------------------------------------------------------------------
// Verifies station and energy-slot business rules with isolated fakes.
// -----------------------------------------------------------------------------
using Microsoft.Extensions.Logging.Abstractions;
using MongoDB.Bson;
using SmartSolarMicrogrid.Api.Contracts.BookingSlots;
using SmartSolarMicrogrid.Api.Contracts.Stations;
using SmartSolarMicrogrid.Api.Models;
using SmartSolarMicrogrid.Api.Persistence.Repositories;
using SmartSolarMicrogrid.Api.Services;

namespace SmartSolarMicrogrid.Api.Tests;

public sealed class StationSlotServiceTests
{
    // Verifies that station creation normalizes its code and assigns Active status.
    [Fact]
    public async Task CreateStation_NormalizesCodeAndCreatesActiveStation()
    {
        var stations = new FakeStationRepository();
        var service = StationService(stations);

        var response = await service.CreateAsync(ValidStation(" stn-cmb-001 "), TestCancellation);

        Assert.Equal("STN-CMB-001", response.StationCode);
        Assert.Equal("Active", response.Status);
        Assert.Equal(79.8612, response.Longitude);
        Assert.Single(stations.Items);
    }

    // Verifies that an existing station code produces a conflict.
    [Fact]
    public async Task CreateStation_RejectsDuplicateCode()
    {
        var stations = new FakeStationRepository();
        stations.Items.Add(Station());
        var exception = await Assert.ThrowsAsync<StationSlotException>(() =>
            StationService(stations).CreateAsync(ValidStation(), TestCancellation));

        Assert.Equal("STATION_CODE_EXISTS", exception.ErrorCode);
        Assert.Equal(StatusCodes.Status409Conflict, exception.StatusCode);
    }

    // Verifies total-capacity and battery-storage constraints.
    [Theory]
    [InlineData(100, 101, "STATION_STORAGE_INVALID")]
    [InlineData(0, 0, "STATION_CAPACITY_INVALID")]
    public async Task CreateStation_RejectsInvalidCapacity(
        double capacity,
        double storage,
        string expectedCode)
    {
        var request = ValidStation() with
        {
            CapacityKwh = (decimal)capacity,
            BatteryStorageKwh = (decimal)storage
        };

        var exception = await Assert.ThrowsAsync<StationSlotException>(() =>
            StationService(new FakeStationRepository()).CreateAsync(request, TestCancellation));

        Assert.Equal(expectedCode, exception.ErrorCode);
    }

    // Verifies that active reservations prevent station deactivation.
    [Fact]
    public async Task ChangeStationStatus_WithActiveReservation_IsRejected()
    {
        var stations = new FakeStationRepository();
        stations.Items.Add(Station());
        var reservations = new FakeReservationQuery { StationHasActive = true };

        var exception = await Assert.ThrowsAsync<StationSlotException>(() =>
            StationService(stations, reservations).ChangeStatusAsync(
                "STN-CMB-001",
                new ChangeStationStatusRequest("Deactivated", "Maintenance"),
                TestCancellation));

        Assert.Equal("STATION_ACTIVE_RESERVATIONS", exception.ErrorCode);
        Assert.Equal(StationStatus.Active, stations.Items[0].Status);
    }

    // Verifies that a station without active reservations can be deactivated.
    [Fact]
    public async Task ChangeStationStatus_WithoutReservation_DeactivatesStation()
    {
        var stations = new FakeStationRepository();
        stations.Items.Add(Station());

        var response = await StationService(stations).ChangeStatusAsync(
            "STN-CMB-001",
            new ChangeStationStatusRequest("Deactivated", null),
            TestCancellation);

        Assert.Equal("Deactivated", response.Status);
        Assert.Equal(StationStatus.Deactivated, stations.Items[0].Status);
    }

    // Verifies that slots cannot be created for inactive stations.
    [Fact]
    public async Task CreateSlot_ForInactiveStation_IsRejected()
    {
        var stations = new FakeStationRepository();
        var station = Station();
        station.Status = StationStatus.Deactivated;
        stations.Items.Add(station);

        var exception = await Assert.ThrowsAsync<StationSlotException>(() =>
            SlotService(stations, new FakeSlotRepository()).CreateAsync(
                station.StationCode, ValidSlot(), TestCancellation));

        Assert.Equal("STATION_NOT_ACTIVE", exception.ErrorCode);
    }

    // Verifies that intersecting slot periods are rejected.
    [Fact]
    public async Task CreateSlot_RejectsOverlappingPeriod()
    {
        var stations = new FakeStationRepository();
        var station = Station();
        stations.Items.Add(station);
        var slots = new FakeSlotRepository { ForceOverlap = true };

        var exception = await Assert.ThrowsAsync<StationSlotException>(() =>
            SlotService(stations, slots).CreateAsync(station.StationCode, ValidSlot(), TestCancellation));

        Assert.Equal("SLOT_TIME_OVERLAP", exception.ErrorCode);
    }

    // Verifies that slot times must remain within station operating hours.
    [Fact]
    public async Task CreateSlot_RejectsPeriodOutsideOperatingSchedule()
    {
        var stations = new FakeStationRepository();
        var station = Station();
        stations.Items.Add(station);
        var start = FutureDay().AddHours(7);

        var exception = await Assert.ThrowsAsync<StationSlotException>(() =>
            SlotService(stations, new FakeSlotRepository()).CreateAsync(
                station.StationCode,
                ValidSlot() with { StartTimeUtc = start, EndTimeUtc = start.AddHours(1) },
                TestCancellation));

        Assert.Equal("SLOT_OUTSIDE_SCHEDULE", exception.ErrorCode);
    }

    // Verifies successful creation of a valid available slot.
    [Fact]
    public async Task CreateSlot_WithValidData_Succeeds()
    {
        var stations = new FakeStationRepository();
        var station = Station();
        stations.Items.Add(station);
        var slots = new FakeSlotRepository();

        var response = await SlotService(stations, slots).CreateAsync(
            station.StationCode, ValidSlot(), TestCancellation);

        Assert.Equal("SLT-CMB-001", response.SlotCode);
        Assert.Equal("Available", response.Status);
        Assert.Single(slots.Items);
    }

    // Verifies that active reservations prevent slot updates.
    [Fact]
    public async Task UpdateSlot_WithActiveReservation_IsRejected()
    {
        var stations = new FakeStationRepository();
        var station = Station();
        stations.Items.Add(station);
        var slots = new FakeSlotRepository();
        slots.Items.Add(Slot(station.Id));
        var reservations = new FakeReservationQuery { SlotHasActive = true };

        var exception = await Assert.ThrowsAsync<StationSlotException>(() =>
            SlotService(stations, slots, reservations).UpdateAsync(
                "SLT-CMB-001",
                new UpdateBookingSlotRequest(
                    slots.Items[0].StartTimeUtc,
                    slots.Items[0].EndTimeUtc,
                    10,
                    45),
                TestCancellation));

        Assert.Equal("SLOT_ACTIVE_RESERVATION", exception.ErrorCode);
    }

    // Verifies that reserved slots cannot be made unavailable.
    [Fact]
    public async Task MakeSlotUnavailable_WithActiveReservation_IsRejected()
    {
        var stations = new FakeStationRepository();
        var station = Station();
        stations.Items.Add(station);
        var slots = new FakeSlotRepository();
        slots.Items.Add(Slot(station.Id));
        var reservations = new FakeReservationQuery { SlotHasActive = true };

        var exception = await Assert.ThrowsAsync<StationSlotException>(() =>
            SlotService(stations, slots, reservations).ChangeStatusAsync(
                "SLT-CMB-001",
                new ChangeBookingSlotStatusRequest("Unavailable", "Maintenance"),
                TestCancellation));

        Assert.Equal("SLOT_ACTIVE_RESERVATION", exception.ErrorCode);
    }

    // Creates the station service with isolated fake dependencies.
    private static SolarStationService StationService(
        FakeStationRepository stations,
        FakeReservationQuery? reservations = null) => new(
            stations,
            reservations ?? new FakeReservationQuery(),
            NullLogger<SolarStationService>.Instance);

    // Creates the booking-slot service with isolated fake dependencies.
    private static BookingSlotService SlotService(
        FakeStationRepository stations,
        FakeSlotRepository slots,
        FakeReservationQuery? reservations = null) => new(
            slots,
            stations,
            reservations ?? new FakeReservationQuery(),
            NullLogger<BookingSlotService>.Instance);

    // Builds a valid station request that tests may customize.
    private static CreateStationRequest ValidStation(string code = "STN-CMB-001") => new(
        code, "Colombo Solar Hub", "Main node", 6.9271, 79.8612, "Colombo",
        120.5m, 80m, TimeSpan.FromHours(8), TimeSpan.FromHours(20));

    // Builds a valid future slot request within station operating hours.
    private static CreateBookingSlotRequest ValidSlot()
    {
        var start = FutureDay().AddHours(10);
        return new CreateBookingSlotRequest("SLT-CMB-001", start, start.AddHours(1), 15m, 45m);
    }

    // Returns a stable future UTC date for slot tests.
    private static DateTime FutureDay() => DateTime.UtcNow.Date.AddDays(2);

    // Builds an active station persistence model for fake repositories.
    private static SolarStation Station() => new()
    {
        Id = ObjectId.GenerateNewId(),
        StationCode = "STN-CMB-001",
        Name = "Colombo Solar Hub",
        Location = new StationLocation { Coordinates = [79.8612, 6.9271], Address = "Colombo" },
        CapacityKwh = 120.5m,
        BatteryStorageKwh = 80m,
        OpeningTime = TimeSpan.FromHours(8),
        ClosingTime = TimeSpan.FromHours(20),
        Status = StationStatus.Active
    };

    // Builds an available slot persistence model for fake repositories.
    private static EnergyBookingSlot Slot(ObjectId stationId)
    {
        var start = FutureDay().AddHours(10);
        return new EnergyBookingSlot
        {
            Id = ObjectId.GenerateNewId(),
            SlotCode = "SLT-CMB-001",
            StationId = stationId,
            StartTimeUtc = start,
            EndTimeUtc = start.AddHours(1),
            AvailableEnergyKwh = 15m,
            PricePerKwh = 45m,
            Status = SlotStatus.Available
        };
    }

    private static CancellationToken TestCancellation => TestContext.Current.CancellationToken;

    private sealed class FakeReservationQuery : IReservationQueryService
    {
        public bool StationHasActive { get; init; }
        public bool SlotHasActive { get; init; }

        // Returns the configured station-reservation result for the current test.
        public Task<bool> HasActiveReservationsForStationAsync(ObjectId stationId, CancellationToken cancellationToken = default) =>
            Task.FromResult(StationHasActive);

        // Returns the configured slot-reservation result for the current test.
        public Task<bool> HasActiveReservationsForSlotAsync(ObjectId slotId, CancellationToken cancellationToken = default) =>
            Task.FromResult(SlotHasActive);
    }

    private sealed class FakeStationRepository : ISolarStationRepository
    {
        public List<SolarStation> Items { get; } = [];

        // Finds a fake station by public code.
        public Task<SolarStation?> FindByCodeAsync(string stationCode, CancellationToken cancellationToken = default) =>
            Task.FromResult(Items.SingleOrDefault(item => item.StationCode == stationCode));

        // Finds a fake station by internal identifier.
        public Task<SolarStation?> FindByIdAsync(ObjectId id, CancellationToken cancellationToken = default) =>
            Task.FromResult(Items.SingleOrDefault(item => item.Id == id));

        // Lists fake stations with an optional status filter.
        public Task<List<SolarStation>> GetAllAsync(StationStatus? status, CancellationToken cancellationToken = default) =>
            Task.FromResult(Items.Where(item => status is null || item.Status == status).ToList());

        // Adds a station to the in-memory test collection.
        public Task CreateAsync(SolarStation station, CancellationToken cancellationToken = default)
        {
            station.Id = ObjectId.GenerateNewId();
            station.CreatedAtUtc = DateTime.UtcNow;
            station.UpdatedAtUtc = station.CreatedAtUtc;
            Items.Add(station);
            return Task.CompletedTask;
        }

        // Reports whether the station exists in the fake collection.
        public Task<bool> UpdateAsync(SolarStation station, CancellationToken cancellationToken = default) =>
            Task.FromResult(Items.Any(item => item.Id == station.Id));

        // Changes station status inside the fake collection.
        public Task<bool> UpdateStatusAsync(string stationCode, StationStatus status, CancellationToken cancellationToken = default)
        {
            var station = Items.SingleOrDefault(item => item.StationCode == stationCode);
            if (station is null) return Task.FromResult(false);
            station.Status = status;
            return Task.FromResult(true);
        }
    }

    private sealed class FakeSlotRepository : IBookingSlotRepository
    {
        public List<EnergyBookingSlot> Items { get; } = [];
        public bool ForceOverlap { get; init; }

        // Finds a fake slot by public code.
        public Task<EnergyBookingSlot?> FindByCodeAsync(string slotCode, CancellationToken cancellationToken = default) =>
            Task.FromResult(Items.SingleOrDefault(item => item.SlotCode == slotCode));

        // Lists fake slots belonging to the requested station.
        public Task<List<EnergyBookingSlot>> GetForStationAsync(ObjectId stationId, DateTime? fromUtc, DateTime? toUtc, SlotStatus? status, CancellationToken cancellationToken = default) =>
            Task.FromResult(Items.Where(item => item.StationId == stationId).ToList());

        // Simulates or calculates overlapping slot periods for service tests.
        public Task<bool> HasOverlapAsync(ObjectId stationId, DateTime startTimeUtc, DateTime endTimeUtc, ObjectId? excludedId = null, CancellationToken cancellationToken = default) =>
            Task.FromResult(ForceOverlap || Items.Any(item => item.StationId == stationId && item.Id != excludedId && item.StartTimeUtc < endTimeUtc && item.EndTimeUtc > startTimeUtc));

        // Adds a slot to the in-memory test collection.
        public Task CreateAsync(EnergyBookingSlot slot, CancellationToken cancellationToken = default)
        {
            slot.Id = ObjectId.GenerateNewId();
            slot.CreatedAtUtc = DateTime.UtcNow;
            slot.UpdatedAtUtc = slot.CreatedAtUtc;
            Items.Add(slot);
            return Task.CompletedTask;
        }

        // Reports whether the slot exists in the fake collection.
        public Task<bool> UpdateAsync(EnergyBookingSlot slot, CancellationToken cancellationToken = default) =>
            Task.FromResult(Items.Any(item => item.Id == slot.Id));

        // Changes slot status inside the fake collection.
        public Task<bool> UpdateStatusAsync(string slotCode, SlotStatus status, CancellationToken cancellationToken = default)
        {
            var slot = Items.SingleOrDefault(item => item.SlotCode == slotCode);
            if (slot is null) return Task.FromResult(false);
            slot.Status = status;
            return Task.FromResult(true);
        }

        // Finds a fake slot by its internal identifier.
        public Task<EnergyBookingSlot?> FindByIdAsync(ObjectId id, CancellationToken cancellationToken = default) =>
            Task.FromResult(Items.SingleOrDefault(item => item.Id == id));

        // Changes fake slot status using its internal identifier.
        public Task<bool> UpdateStatusByIdAsync(ObjectId id, SlotStatus status, CancellationToken cancellationToken = default)
        {
            var slot = Items.SingleOrDefault(item => item.Id == id);
            if (slot is null) return Task.FromResult(false);
            slot.Status = status;
            return Task.FromResult(true);
        }
    }
}
