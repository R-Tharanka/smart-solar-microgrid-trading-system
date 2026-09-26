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

    private static SolarStationService StationService(
        FakeStationRepository stations,
        FakeReservationQuery? reservations = null) => new(
            stations,
            reservations ?? new FakeReservationQuery(),
            NullLogger<SolarStationService>.Instance);

    private static BookingSlotService SlotService(
        FakeStationRepository stations,
        FakeSlotRepository slots,
        FakeReservationQuery? reservations = null) => new(
            slots,
            stations,
            reservations ?? new FakeReservationQuery(),
            NullLogger<BookingSlotService>.Instance);

    private static CreateStationRequest ValidStation(string code = "STN-CMB-001") => new(
        code, "Colombo Solar Hub", "Main node", 6.9271, 79.8612, "Colombo",
        120.5m, 80m, TimeSpan.FromHours(8), TimeSpan.FromHours(20));

    private static CreateBookingSlotRequest ValidSlot()
    {
        var start = FutureDay().AddHours(10);
        return new CreateBookingSlotRequest("SLT-CMB-001", start, start.AddHours(1), 15m, 45m);
    }

    private static DateTime FutureDay() => DateTime.UtcNow.Date.AddDays(2);

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

        public Task<bool> HasActiveReservationsForStationAsync(ObjectId stationId, CancellationToken cancellationToken = default) =>
            Task.FromResult(StationHasActive);

        public Task<bool> HasActiveReservationsForSlotAsync(ObjectId slotId, CancellationToken cancellationToken = default) =>
            Task.FromResult(SlotHasActive);
    }

    private sealed class FakeStationRepository : ISolarStationRepository
    {
        public List<SolarStation> Items { get; } = [];

        public Task<SolarStation?> FindByCodeAsync(string stationCode, CancellationToken cancellationToken = default) =>
            Task.FromResult(Items.SingleOrDefault(item => item.StationCode == stationCode));

        public Task<SolarStation?> FindByIdAsync(ObjectId id, CancellationToken cancellationToken = default) =>
            Task.FromResult(Items.SingleOrDefault(item => item.Id == id));

        public Task<List<SolarStation>> GetAllAsync(StationStatus? status, CancellationToken cancellationToken = default) =>
            Task.FromResult(Items.Where(item => status is null || item.Status == status).ToList());

        public Task CreateAsync(SolarStation station, CancellationToken cancellationToken = default)
        {
            station.Id = ObjectId.GenerateNewId();
            station.CreatedAtUtc = DateTime.UtcNow;
            station.UpdatedAtUtc = station.CreatedAtUtc;
            Items.Add(station);
            return Task.CompletedTask;
        }

        public Task<bool> UpdateAsync(SolarStation station, CancellationToken cancellationToken = default) =>
            Task.FromResult(Items.Any(item => item.Id == station.Id));

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

        public Task<EnergyBookingSlot?> FindByCodeAsync(string slotCode, CancellationToken cancellationToken = default) =>
            Task.FromResult(Items.SingleOrDefault(item => item.SlotCode == slotCode));

        public Task<List<EnergyBookingSlot>> GetForStationAsync(ObjectId stationId, DateTime? fromUtc, DateTime? toUtc, SlotStatus? status, CancellationToken cancellationToken = default) =>
            Task.FromResult(Items.Where(item => item.StationId == stationId).ToList());

        public Task<bool> HasOverlapAsync(ObjectId stationId, DateTime startTimeUtc, DateTime endTimeUtc, ObjectId? excludedId = null, CancellationToken cancellationToken = default) =>
            Task.FromResult(ForceOverlap || Items.Any(item => item.StationId == stationId && item.Id != excludedId && item.StartTimeUtc < endTimeUtc && item.EndTimeUtc > startTimeUtc));

        public Task CreateAsync(EnergyBookingSlot slot, CancellationToken cancellationToken = default)
        {
            slot.Id = ObjectId.GenerateNewId();
            slot.CreatedAtUtc = DateTime.UtcNow;
            slot.UpdatedAtUtc = slot.CreatedAtUtc;
            Items.Add(slot);
            return Task.CompletedTask;
        }

        public Task<bool> UpdateAsync(EnergyBookingSlot slot, CancellationToken cancellationToken = default) =>
            Task.FromResult(Items.Any(item => item.Id == slot.Id));

        public Task<bool> UpdateStatusAsync(string slotCode, SlotStatus status, CancellationToken cancellationToken = default)
        {
            var slot = Items.SingleOrDefault(item => item.SlotCode == slotCode);
            if (slot is null) return Task.FromResult(false);
            slot.Status = status;
            return Task.FromResult(true);
        }

        public Task<EnergyBookingSlot?> FindByIdAsync(ObjectId id, CancellationToken cancellationToken = default) =>
            Task.FromResult(Items.SingleOrDefault(item => item.Id == id));

        public Task<bool> UpdateStatusByIdAsync(ObjectId id, SlotStatus status, CancellationToken cancellationToken = default)
        {
            var slot = Items.SingleOrDefault(item => item.Id == id);
            if (slot is null) return Task.FromResult(false);
            slot.Status = status;
            return Task.FromResult(true);
        }
    }
}
