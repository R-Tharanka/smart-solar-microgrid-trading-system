using Microsoft.Extensions.Logging.Abstractions;
using MongoDB.Bson;
using SmartSolarMicrogrid.Api.Contracts.Reservations;
using SmartSolarMicrogrid.Api.Models;
using SmartSolarMicrogrid.Api.Persistence.Repositories;
using SmartSolarMicrogrid.Api.Services;

namespace SmartSolarMicrogrid.Api.Tests;

public sealed class ReservationServiceTests
{
    // Fixed "now" used by the test clock: 2026-09-26 09:00 UTC
    private static readonly DateTime Now = new(2026, 9, 26, 9, 0, 0, DateTimeKind.Utc);

    // Slot scheduled to start in 3 days (well within 7-day window)
    private static readonly DateTime SlotStart = Now.AddDays(3);
    private static readonly DateTime SlotEnd = SlotStart.AddHours(2);

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private static ReservationService Service(
        FakeReservationRepository? reservations = null,
        FakeStationRepository? stations = null,
        FakeSlotRepository? slots = null) =>
        new(
            reservations ?? new FakeReservationRepository(),
            stations ?? new FakeStationRepository(ActiveStation()),
            slots ?? new FakeSlotRepository(AvailableSlot()),
            new FixedTimeProvider(Now),
            NullLogger<ReservationService>.Instance);

    private static SolarStation ActiveStation() => new()
    {
        Id = ObjectId.GenerateNewId(),
        Status = StationStatus.Active
    };

    private static EnergyBookingSlot AvailableSlot(decimal energy = 50m, SlotStatus status = SlotStatus.Available) => new()
    {
        Id = ObjectId.GenerateNewId(),
        StationId = ObjectId.GenerateNewId(),
        StartTimeUtc = SlotStart,
        EndTimeUtc = SlotEnd,
        AvailableEnergyKwh = energy,
        Status = status
    };

    private static EnergyReservation PendingReservation(
        string prosumerNic = "200012345678",
        ReservationStatus status = ReservationStatus.Pending,
        DateTime? start = null) => new()
    {
        Id = ObjectId.GenerateNewId(),
        ReservationCode = "RSV-20260926-ABCD01",
        ProsumerNic = prosumerNic,
        StationId = ObjectId.GenerateNewId(),
        SlotId = ObjectId.GenerateNewId(),
        RequestedEnergyKwh = 10m,
        ScheduledStartTimeUtc = start ?? SlotStart,
        ScheduledEndTimeUtc = (start ?? SlotStart).AddHours(2),
        Status = status,
        CreatedAtUtc = Now.AddDays(-1),
        UpdatedAtUtc = Now.AddDays(-1)
    };

    // -------------------------------------------------------------------------
    // 1 & 2. CREATE — success and station-not-found
    // -------------------------------------------------------------------------

    [Fact]
    public async Task Create_ValidRequest_ReturnsReservationWithPendingStatus()
    {
        var station = ActiveStation();
        var slot = AvailableSlot();
        slot.StationId = station.Id;
        var reservationRepo = new FakeReservationRepository();
        var stationRepo = new FakeStationRepository(station);
        var slotRepo = new FakeSlotRepository(slot);
        var service = Service(reservationRepo, stationRepo, slotRepo);

        var result = await service.CreateAsync("200012345678",
            new CreateReservationRequest(station.Id.ToString(), slot.Id.ToString(), 20m),
            TestContext.Current.CancellationToken);

        Assert.Equal("Pending", result.Status);
        Assert.Equal(20m, result.RequestedEnergyKwh);
        Assert.StartsWith("RSV-", result.ReservationCode);
        Assert.Equal(SlotStatus.Reserved, slotRepo.Slot.Status);
    }

    [Fact]
    public async Task Create_StationNotFound_Throws()
    {
        var stationRepo = new FakeStationRepository(null);
        var service = Service(stations: stationRepo);

        var ex = await Assert.ThrowsAsync<ReservationException>(() =>
            service.CreateAsync("NIC", new CreateReservationRequest(ObjectId.GenerateNewId().ToString(),
                ObjectId.GenerateNewId().ToString(), 10m), TestContext.Current.CancellationToken));

        Assert.Equal("RESERVATION_STATION_NOT_FOUND", ex.ErrorCode);
    }

    // -------------------------------------------------------------------------
    // 3. CREATE — station inactive
    // -------------------------------------------------------------------------

    [Fact]
    public async Task Create_StationInactive_Throws()
    {
        var station = ActiveStation();
        station.Status = StationStatus.Deactivated;
        var slot = AvailableSlot();
        slot.StationId = station.Id;

        var ex = await Assert.ThrowsAsync<ReservationException>(() =>
            Service(new FakeReservationRepository(), new FakeStationRepository(station), new FakeSlotRepository(slot))
                .CreateAsync("NIC", new CreateReservationRequest(station.Id.ToString(), slot.Id.ToString(), 10m),
                    TestContext.Current.CancellationToken));

        Assert.Equal("RESERVATION_STATION_NOT_ACTIVE", ex.ErrorCode);
    }

    // -------------------------------------------------------------------------
    // 4. CREATE — slot not found
    // -------------------------------------------------------------------------

    [Fact]
    public async Task Create_SlotNotFound_Throws()
    {
        var station = ActiveStation();
        var ex = await Assert.ThrowsAsync<ReservationException>(() =>
            Service(new FakeReservationRepository(), new FakeStationRepository(station), new FakeSlotRepository(null))
                .CreateAsync("NIC", new CreateReservationRequest(station.Id.ToString(),
                    ObjectId.GenerateNewId().ToString(), 10m), TestContext.Current.CancellationToken));

        Assert.Equal("RESERVATION_SLOT_NOT_FOUND", ex.ErrorCode);
    }

    // -------------------------------------------------------------------------
    // 5. CREATE — slot unavailable
    // -------------------------------------------------------------------------

    [Fact]
    public async Task Create_SlotNotAvailable_Throws()
    {
        var station = ActiveStation();
        var slot = AvailableSlot(status: SlotStatus.Reserved);
        slot.StationId = station.Id;

        var ex = await Assert.ThrowsAsync<ReservationException>(() =>
            Service(new FakeReservationRepository(), new FakeStationRepository(station), new FakeSlotRepository(slot))
                .CreateAsync("NIC", new CreateReservationRequest(station.Id.ToString(), slot.Id.ToString(), 10m),
                    TestContext.Current.CancellationToken));

        Assert.Equal("RESERVATION_SLOT_NOT_AVAILABLE", ex.ErrorCode);
    }

    // -------------------------------------------------------------------------
    // 6. CREATE — zero energy
    // -------------------------------------------------------------------------

    [Fact]
    public async Task Create_ZeroEnergy_Throws()
    {
        var station = ActiveStation();
        var slot = AvailableSlot();
        slot.StationId = station.Id;

        var ex = await Assert.ThrowsAsync<ReservationException>(() =>
            Service(new FakeReservationRepository(), new FakeStationRepository(station), new FakeSlotRepository(slot))
                .CreateAsync("NIC", new CreateReservationRequest(station.Id.ToString(), slot.Id.ToString(), 0m),
                    TestContext.Current.CancellationToken));

        Assert.Equal("RESERVATION_ENERGY_INVALID", ex.ErrorCode);
    }

    // -------------------------------------------------------------------------
    // 7. CREATE — energy exceeds slot
    // -------------------------------------------------------------------------

    [Fact]
    public async Task Create_EnergyExceedsSlot_Throws()
    {
        var station = ActiveStation();
        var slot = AvailableSlot(energy: 10m);
        slot.StationId = station.Id;

        var ex = await Assert.ThrowsAsync<ReservationException>(() =>
            Service(new FakeReservationRepository(), new FakeStationRepository(station), new FakeSlotRepository(slot))
                .CreateAsync("NIC", new CreateReservationRequest(station.Id.ToString(), slot.Id.ToString(), 50m),
                    TestContext.Current.CancellationToken));

        Assert.Equal("RESERVATION_ENERGY_INVALID", ex.ErrorCode);
    }

    // -------------------------------------------------------------------------
    // 8. CREATE — beyond 7-day window
    // -------------------------------------------------------------------------

    [Fact]
    public async Task Create_SlotBeyond7DayWindow_Throws()
    {
        var station = ActiveStation();
        var slot = AvailableSlot();
        slot.StartTimeUtc = Now.AddDays(8); // beyond 7-day window
        slot.EndTimeUtc = slot.StartTimeUtc.AddHours(2);
        slot.StationId = station.Id;

        var ex = await Assert.ThrowsAsync<ReservationException>(() =>
            Service(new FakeReservationRepository(), new FakeStationRepository(station), new FakeSlotRepository(slot))
                .CreateAsync("NIC", new CreateReservationRequest(station.Id.ToString(), slot.Id.ToString(), 5m),
                    TestContext.Current.CancellationToken));

        Assert.Equal("RESERVATION_WINDOW_INVALID", ex.ErrorCode);
    }

    // -------------------------------------------------------------------------
    // 9. GET OWN — returns prosumer's reservations
    // -------------------------------------------------------------------------

    [Fact]
    public async Task GetOwn_ReturnsProsumerReservations()
    {
        var r = PendingReservation("200012345678");
        var repo = new FakeReservationRepository(r);
        var result = await Service(repo).GetOwnAsync("200012345678", null, TestContext.Current.CancellationToken);

        Assert.Single(result);
        Assert.Equal("RSV-20260926-ABCD01", result.First().ReservationCode);
    }

    // -------------------------------------------------------------------------
    // 10. GET BY ID — ownership protection
    // -------------------------------------------------------------------------

    [Fact]
    public async Task GetById_DifferentProsumer_Throws()
    {
        var r = PendingReservation("200012345678");
        var repo = new FakeReservationRepository(r);

        var ex = await Assert.ThrowsAsync<ReservationException>(() =>
            Service(repo).GetByIdAsync(r.Id.ToString(), "OTHER-NIC", UserRole.Prosumer,
                TestContext.Current.CancellationToken));

        Assert.Equal(StatusCodes.Status403Forbidden, ex.StatusCode);
        Assert.Equal("RESERVATION_NOT_OWNED", ex.ErrorCode);
    }

    // -------------------------------------------------------------------------
    // 11. UPDATE — successful update
    // -------------------------------------------------------------------------

    [Fact]
    public async Task Update_ValidRequest_ChangesEnergyAmount()
    {
        var r = PendingReservation();
        var slot = AvailableSlot(energy: 50m);
        slot.Id = r.SlotId;
        var repo = new FakeReservationRepository(r);
        var service = Service(repo, slots: new FakeSlotRepository(slot));

        var result = await service.UpdateAsync(r.Id.ToString(), r.ProsumerNic,
            new UpdateReservationRequest(30m), TestContext.Current.CancellationToken);

        Assert.Equal(30m, result.RequestedEnergyKwh);
    }

    // -------------------------------------------------------------------------
    // 12. UPDATE — inside 12-hour window
    // -------------------------------------------------------------------------

    [Fact]
    public async Task Update_InsideNoticePeriod_Throws()
    {
        // Slot starts in 6 hours — within the 12-hour notice period.
        var r = PendingReservation(start: Now.AddHours(6));
        var slot = AvailableSlot();
        slot.Id = r.SlotId;
        var repo = new FakeReservationRepository(r);

        var ex = await Assert.ThrowsAsync<ReservationException>(() =>
            Service(repo, slots: new FakeSlotRepository(slot)).UpdateAsync(r.Id.ToString(), r.ProsumerNic,
                new UpdateReservationRequest(5m), TestContext.Current.CancellationToken));

        Assert.Equal("RESERVATION_NOTICE_PERIOD", ex.ErrorCode);
    }

    // -------------------------------------------------------------------------
    // 13. UPDATE — invalid status (QrIssued)
    // -------------------------------------------------------------------------

    [Fact]
    public async Task Update_QrIssuedStatus_Throws()
    {
        var r = PendingReservation(status: ReservationStatus.QrIssued);
        var repo = new FakeReservationRepository(r);

        var ex = await Assert.ThrowsAsync<ReservationException>(() =>
            Service(repo).UpdateAsync(r.Id.ToString(), r.ProsumerNic,
                new UpdateReservationRequest(5m), TestContext.Current.CancellationToken));

        Assert.Equal("RESERVATION_INVALID_STATUS", ex.ErrorCode);
    }

    // -------------------------------------------------------------------------
    // 14. CANCEL — successful cancellation
    // -------------------------------------------------------------------------

    [Fact]
    public async Task Cancel_PendingReservation_SetsStatusAndRestoresSlot()
    {
        var r = PendingReservation();
        var slot = AvailableSlot(status: SlotStatus.Reserved);
        slot.Id = r.SlotId;
        var repo = new FakeReservationRepository(r);
        var slotRepo = new FakeSlotRepository(slot);

        await Service(repo, slots: slotRepo).CancelAsync(r.Id.ToString(), r.ProsumerNic,
            new CancelReservationRequest(), TestContext.Current.CancellationToken);

        Assert.Equal(ReservationStatus.Cancelled, r.Status);
        Assert.Equal(SlotStatus.Available, slotRepo.Slot.Status);
    }

    // -------------------------------------------------------------------------
    // 15. CANCEL — inside 12-hour notice period
    // -------------------------------------------------------------------------

    [Fact]
    public async Task Cancel_InsideNoticePeriod_Throws()
    {
        var r = PendingReservation(start: Now.AddHours(5));
        var repo = new FakeReservationRepository(r);

        var ex = await Assert.ThrowsAsync<ReservationException>(() =>
            Service(repo).CancelAsync(r.Id.ToString(), r.ProsumerNic,
                new CancelReservationRequest(), TestContext.Current.CancellationToken));

        Assert.Equal("RESERVATION_NOTICE_PERIOD", ex.ErrorCode);
    }

    // -------------------------------------------------------------------------
    // 16. CANCEL — terminal/QR status
    // -------------------------------------------------------------------------

    [Theory]
    [InlineData(ReservationStatus.QrIssued)]
    [InlineData(ReservationStatus.Verified)]
    [InlineData(ReservationStatus.Completed)]
    [InlineData(ReservationStatus.Rejected)]
    [InlineData(ReservationStatus.Expired)]
    public async Task Cancel_NonCancellableStatus_Throws(ReservationStatus status)
    {
        var r = PendingReservation(status: status);
        var repo = new FakeReservationRepository(r);

        var ex = await Assert.ThrowsAsync<ReservationException>(() =>
            Service(repo).CancelAsync(r.Id.ToString(), r.ProsumerNic,
                new CancelReservationRequest(), TestContext.Current.CancellationToken));

        Assert.Equal("RESERVATION_INVALID_STATUS", ex.ErrorCode);
    }

    // -------------------------------------------------------------------------
    // 17. APPROVE — successful approval
    // -------------------------------------------------------------------------

    [Fact]
    public async Task Approve_PendingReservation_TransitionsToApproved()
    {
        var r = PendingReservation();
        var repo = new FakeReservationRepository(r);

        var result = await Service(repo).ApproveAsync(r.Id.ToString(), TestContext.Current.CancellationToken);

        Assert.Equal("Approved", result.Status);
        Assert.Equal(ReservationStatus.Approved, r.Status);
    }

    // -------------------------------------------------------------------------
    // 18. APPROVE — not Pending
    // -------------------------------------------------------------------------

    [Fact]
    public async Task Approve_AlreadyApproved_Throws()
    {
        var r = PendingReservation(status: ReservationStatus.Approved);
        var repo = new FakeReservationRepository(r);

        var ex = await Assert.ThrowsAsync<ReservationException>(() =>
            Service(repo).ApproveAsync(r.Id.ToString(), TestContext.Current.CancellationToken));

        Assert.Equal("RESERVATION_APPROVAL_INVALID", ex.ErrorCode);
    }

    // -------------------------------------------------------------------------
    // 19. REJECT — successful rejection
    // -------------------------------------------------------------------------

    [Fact]
    public async Task Reject_PendingReservation_TransitionsToRejectedAndRestoresSlot()
    {
        var r = PendingReservation();
        var slot = AvailableSlot(status: SlotStatus.Reserved);
        slot.Id = r.SlotId;
        var repo = new FakeReservationRepository(r);
        var slotRepo = new FakeSlotRepository(slot);

        await Service(repo, slots: slotRepo).RejectAsync(r.Id.ToString(),
            new RejectReservationRequest("Station maintenance required"),
            TestContext.Current.CancellationToken);

        Assert.Equal(ReservationStatus.Rejected, r.Status);
        Assert.Equal(SlotStatus.Available, slotRepo.Slot.Status);
    }

    // -------------------------------------------------------------------------
    // 20. REJECT — reason required
    // -------------------------------------------------------------------------

    [Fact]
    public async Task Reject_EmptyReason_Throws()
    {
        var r = PendingReservation();
        var repo = new FakeReservationRepository(r);

        var ex = await Assert.ThrowsAsync<ReservationException>(() =>
            Service(repo).RejectAsync(r.Id.ToString(),
                new RejectReservationRequest("   "),
                TestContext.Current.CancellationToken));

        Assert.Equal("RESERVATION_REJECTION_REASON_REQUIRED", ex.ErrorCode);
    }

    // -------------------------------------------------------------------------
    // 21. Slot restored after rejection (also validated above in test 19)
    // 22. Slot restored after cancellation (validated in test 14)
    // -------------------------------------------------------------------------

    // -------------------------------------------------------------------------
    // 23. Reservation code format
    // -------------------------------------------------------------------------

    [Fact]
    public async Task Create_GeneratesCorrectReservationCodeFormat()
    {
        var station = ActiveStation();
        var slot = AvailableSlot();
        slot.StationId = station.Id;
        var service = Service(new FakeReservationRepository(), new FakeStationRepository(station),
            new FakeSlotRepository(slot));

        var result = await service.CreateAsync("200012345678",
            new CreateReservationRequest(station.Id.ToString(), slot.Id.ToString(), 5m),
            TestContext.Current.CancellationToken);

        Assert.Matches(@"^RSV-\d{8}-[A-Z0-9]{6}$", result.ReservationCode);
    }

    // -------------------------------------------------------------------------
    // 24. Dashboard counts
    // -------------------------------------------------------------------------

    [Fact]
    public async Task GetDashboardSummary_ReturnsCorrectCounts()
    {
        var repo = new FakeReservationRepository(
            PendingReservation(status: ReservationStatus.Pending),
            PendingReservation(status: ReservationStatus.Approved),
            PendingReservation(status: ReservationStatus.Completed));

        var result = await Service(repo).GetDashboardSummaryAsync(TestContext.Current.CancellationToken);

        Assert.Equal(1, result.PendingCount);
        Assert.Equal(1, result.ApprovedCount);
        Assert.Equal(1, result.CompletedCount);
        Assert.Equal(3, result.TotalCount);
    }

    // -------------------------------------------------------------------------
    // Issue 1 — Update modifies ONLY requested energy
    // -------------------------------------------------------------------------

    [Fact]
    public async Task Update_ModifiesOnlyRequestedEnergy()
    {
        var r = PendingReservation();
        var originalSlotId = r.SlotId;
        var slot = AvailableSlot(energy: 50m);
        slot.Id = originalSlotId;
        var repo = new FakeReservationRepository(r);
        var service = Service(repo, slots: new FakeSlotRepository(slot));

        var result = await service.UpdateAsync(r.Id.ToString(), r.ProsumerNic,
            new UpdateReservationRequest(25m), TestContext.Current.CancellationToken);

        Assert.Equal(25m, result.RequestedEnergyKwh);
        Assert.Equal(25m, r.RequestedEnergyKwh);
        Assert.Equal(originalSlotId.ToString(), result.SlotId);
        Assert.Equal(originalSlotId, r.SlotId);
    }

    [Fact]
    public async Task Update_DoesNotOverwriteQrOrTransactionFields()
    {
        // Arrange: a Pending reservation that already has QR/transaction data written by Member 4.
        var r = PendingReservation();
        r.QrTokenHash = "somehash";
        r.QrExpiresAtUtc = Now.AddHours(2);
        r.VerifiedByUserId = "operator@example.com";
        r.VerifiedAtUtc = Now.AddHours(1);
        r.FinalizedByUserId = "operator@example.com";
        r.FinalizedAtUtc = Now.AddHours(1);

        var slot = AvailableSlot(energy: 50m);
        slot.Id = r.SlotId;
        var repo = new FakeReservationRepository(r);
        var service = Service(repo, slots: new FakeSlotRepository(slot));

        // Act: Prosumer updates energy.
        await service.UpdateAsync(r.Id.ToString(), r.ProsumerNic,
            new UpdateReservationRequest(25m), TestContext.Current.CancellationToken);

        // Assert: energy was updated.
        Assert.Equal(25m, r.RequestedEnergyKwh);

        // Assert: Member 4 QR/transaction fields are unchanged.
        Assert.Equal("somehash", r.QrTokenHash);
        Assert.NotNull(r.QrExpiresAtUtc);
        Assert.Equal("operator@example.com", r.VerifiedByUserId);
        Assert.NotNull(r.VerifiedAtUtc);
        Assert.Equal("operator@example.com", r.FinalizedByUserId);
        Assert.NotNull(r.FinalizedAtUtc);
    }

    // -------------------------------------------------------------------------
    // Issue 2 — Rejection reason is persisted into confirmationNote
    // -------------------------------------------------------------------------

    [Fact]
    public async Task Reject_PersistsReasonIntoConfirmationNote()
    {
        const string reason = "Station under maintenance";
        var r = PendingReservation();
        var slot = AvailableSlot(status: SlotStatus.Reserved);
        slot.Id = r.SlotId;
        var repo = new FakeReservationRepository(r);
        var slotRepo = new FakeSlotRepository(slot);

        var result = await Service(repo, slots: slotRepo).RejectAsync(r.Id.ToString(),
            new RejectReservationRequest(reason), TestContext.Current.CancellationToken);

        // Status transitions.
        Assert.Equal("Rejected", result.Status);
        Assert.Equal(ReservationStatus.Rejected, r.Status);

        // Rejection reason is available in the response ConfirmationNote.
        Assert.Equal(reason, result.ConfirmationNote);

        // Rejection reason is also persisted on the in-memory domain object (as the fake does).
        Assert.Equal(reason, r.ConfirmationNote);

        // Slot was restored.
        Assert.Equal(SlotStatus.Available, slotRepo.Slot.Status);
    }

    // -------------------------------------------------------------------------
    // Issue 4 — Cancellation reason is persisted
    // -------------------------------------------------------------------------

    [Fact]
    public async Task Cancel_PersistsReasonIntoConfirmationNote()
    {
        const string reason = "Schedule changed";
        var r = PendingReservation();
        var slot = AvailableSlot(status: SlotStatus.Reserved);
        slot.Id = r.SlotId;
        var repo = new FakeReservationRepository(r);
        var slotRepo = new FakeSlotRepository(slot);

        var result = await Service(repo, slots: slotRepo).CancelAsync(r.Id.ToString(), r.ProsumerNic,
            new CancelReservationRequest(reason), TestContext.Current.CancellationToken);

        Assert.Equal("Cancelled", result.Status);
        Assert.Equal(reason, result.ConfirmationNote);
        Assert.Equal(reason, r.ConfirmationNote);
    }

    [Fact]
    public async Task Reject_LeadingTrailingWhitespaceTrimmedBeforePersisting()
    {
        var r = PendingReservation();
        var slot = AvailableSlot(status: SlotStatus.Reserved);
        slot.Id = r.SlotId;
        var repo = new FakeReservationRepository(r);

        var result = await Service(repo, slots: new FakeSlotRepository(slot)).RejectAsync(
            r.Id.ToString(), new RejectReservationRequest("  Needs review  "),
            TestContext.Current.CancellationToken);

        Assert.Equal("Needs review", result.ConfirmationNote);
        Assert.Equal("Needs review", r.ConfirmationNote);
    }

    // -------------------------------------------------------------------------
    // Fakes
    // -------------------------------------------------------------------------

    private sealed class FixedTimeProvider(DateTime utcNow) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => new(utcNow);
    }

    private sealed class FakeReservationRepository(params EnergyReservation[] items) : IReservationRepository
    {
        private readonly List<EnergyReservation> _items = [..items];

        public Task CreateAsync(EnergyReservation reservation, CancellationToken cancellationToken = default)
        {
            reservation.CreatedAtUtc = DateTime.UtcNow;
            reservation.UpdatedAtUtc = DateTime.UtcNow;
            _items.Add(reservation);
            return Task.CompletedTask;
        }

        public Task<EnergyReservation?> FindByIdAsync(string reservationId, CancellationToken cancellationToken = default) =>
            Task.FromResult(_items.FirstOrDefault(r => r.Id.ToString() == reservationId));

        public Task<EnergyReservation?> FindByCodeAsync(string reservationCode, CancellationToken cancellationToken = default) =>
            Task.FromResult(_items.FirstOrDefault(r => r.ReservationCode == reservationCode));

        public Task<List<EnergyReservation>> GetByProsumerAsync(
            string prosumerNic, ReservationStatus? status, CancellationToken cancellationToken = default) =>
            Task.FromResult(_items
                .Where(r => r.ProsumerNic == prosumerNic && (status == null || r.Status == status))
                .OrderByDescending(r => r.ScheduledStartTimeUtc)
                .ToList());

        public Task<List<EnergyReservation>> GetAllAsync(
            ReservationStatus? status, MongoDB.Bson.ObjectId? stationId, CancellationToken cancellationToken = default) =>
            Task.FromResult(_items
                .Where(r => (status == null || r.Status == status) && (stationId == null || r.StationId == stationId))
                .ToList());

        public Task<bool> UpdateAsync(EnergyReservation reservation, CancellationToken cancellationToken = default)
        {
            reservation.UpdatedAtUtc = DateTime.UtcNow;
            return Task.FromResult(true);
        }

        public Task<bool> UpdateEnergyAsync(
            MongoDB.Bson.ObjectId id,
            string prosumerNic,
            IReadOnlyCollection<ReservationStatus> allowedStatuses,
            decimal requestedEnergyKwh,
            DateTime changedAtUtc,
            CancellationToken cancellationToken = default)
        {
            var item = _items.FirstOrDefault(r =>
                r.Id == id &&
                string.Equals(r.ProsumerNic, prosumerNic, StringComparison.OrdinalIgnoreCase) &&
                allowedStatuses.Contains(r.Status));
            if (item == null) return Task.FromResult(false);
            item.RequestedEnergyKwh = requestedEnergyKwh;
            item.UpdatedAtUtc = changedAtUtc;
            return Task.FromResult(true);
        }

        public Task<bool> RejectWithNoteAsync(
            MongoDB.Bson.ObjectId id,
            string rejectionReason,
            DateTime changedAtUtc,
            CancellationToken cancellationToken = default)
        {
            var item = _items.FirstOrDefault(r => r.Id == id && r.Status == ReservationStatus.Pending);
            if (item == null) return Task.FromResult(false);
            item.Status = ReservationStatus.Rejected;
            item.ConfirmationNote = rejectionReason;
            item.UpdatedAtUtc = changedAtUtc;
            return Task.FromResult(true);
        }

        public Task<bool> UpdateStatusAsync(
            MongoDB.Bson.ObjectId id,
            ReservationStatus expectedStatus,
            ReservationStatus newStatus,
            DateTime changedAtUtc,
            string? confirmationNote = null,
            CancellationToken cancellationToken = default)
        {
            var item = _items.FirstOrDefault(r => r.Id == id && r.Status == expectedStatus);
            if (item == null) return Task.FromResult(false);
            item.Status = newStatus;
            item.UpdatedAtUtc = changedAtUtc;
            if (confirmationNote != null)
            {
                item.ConfirmationNote = confirmationNote;
            }
            return Task.FromResult(true);
        }

        public Task<Dictionary<ReservationStatus, long>> GetStatusCountsAsync(CancellationToken cancellationToken = default) =>
            Task.FromResult(_items
                .GroupBy(r => r.Status)
                .ToDictionary(g => g.Key, g => (long)g.Count()));

        public Task<Dictionary<ReservationStatus, long>> GetProsumerStatusCountsAsync(
            string prosumerNic, CancellationToken cancellationToken = default) =>
            Task.FromResult(_items
                .Where(r => r.ProsumerNic == prosumerNic)
                .GroupBy(r => r.Status)
                .ToDictionary(g => g.Key, g => (long)g.Count()));
    }

    private sealed class FakeStationRepository(SolarStation? station) : ISolarStationRepository
    {
        public Task<SolarStation?> FindByIdAsync(MongoDB.Bson.ObjectId id, CancellationToken cancellationToken = default) =>
            Task.FromResult(station);

        // Remaining interface members not used by ReservationService — minimal stubs.
        public Task<SolarStation?> FindByCodeAsync(string code, CancellationToken cancellationToken = default) =>
            Task.FromResult<SolarStation?>(null);
        public Task<List<SolarStation>> GetAllAsync(StationStatus? status = null, CancellationToken cancellationToken = default) =>
            Task.FromResult(new List<SolarStation>());
        public Task CreateAsync(SolarStation station, CancellationToken cancellationToken = default) =>
            Task.CompletedTask;
        public Task<bool> UpdateAsync(SolarStation station, CancellationToken cancellationToken = default) =>
            Task.FromResult(true);
        public Task<bool> UpdateStatusAsync(string code, StationStatus status, CancellationToken cancellationToken = default) =>
            Task.FromResult(true);
    }

    private sealed class FakeSlotRepository(EnergyBookingSlot? slot) : IBookingSlotRepository
    {
        public EnergyBookingSlot Slot => slot!;

        public Task<EnergyBookingSlot?> FindByIdAsync(MongoDB.Bson.ObjectId id, CancellationToken cancellationToken = default) =>
            Task.FromResult(slot?.Id == id ? slot : null);

        public Task<EnergyBookingSlot?> FindByCodeAsync(string slotCode, CancellationToken cancellationToken = default) =>
            Task.FromResult<EnergyBookingSlot?>(null);

        public Task<List<EnergyBookingSlot>> GetForStationAsync(
            MongoDB.Bson.ObjectId stationId, DateTime? fromUtc, DateTime? toUtc, SlotStatus? status,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(new List<EnergyBookingSlot>());

        public Task<bool> HasOverlapAsync(
            MongoDB.Bson.ObjectId stationId, DateTime startTimeUtc, DateTime endTimeUtc,
            MongoDB.Bson.ObjectId? excludedId = null, CancellationToken cancellationToken = default) =>
            Task.FromResult(false);

        public Task CreateAsync(EnergyBookingSlot s, CancellationToken cancellationToken = default) =>
            Task.CompletedTask;

        public Task<bool> UpdateAsync(EnergyBookingSlot s, CancellationToken cancellationToken = default) =>
            Task.FromResult(true);

        public Task<bool> UpdateStatusAsync(string slotCode, SlotStatus status, CancellationToken cancellationToken = default) =>
            Task.FromResult(true);

        public Task<bool> UpdateStatusByIdAsync(MongoDB.Bson.ObjectId id, SlotStatus status, CancellationToken cancellationToken = default)
        {
            if (slot != null && slot.Id == id)
            {
                slot.Status = status;
                return Task.FromResult(true);
            }
            return Task.FromResult(false);
        }
    }
}
