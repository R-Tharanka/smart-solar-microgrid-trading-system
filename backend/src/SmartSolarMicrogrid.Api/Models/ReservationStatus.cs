namespace SmartSolarMicrogrid.Api.Models;

public enum ReservationStatus
{
    // Member 3 booking workflow states.
    Pending,
    Approved,
    Rejected,
    Cancelled,

    // Member 4 transaction workflow states.
    QrIssued,
    Verified,
    Completed,

    // Terminal timeout state shared by the reservation lifecycle.
    Expired
}
