package com.smartsolar.microgrid.data.reservation;

public class ProsumerDashboardResponse {
    private long pendingCount;
    private long approvedCount;
    private long approvedFutureCount;
    private long completedCount;
    private long cancelledCount;
    private long totalCount;

    public long getPendingCount() { return pendingCount; }
    public long getApprovedCount() { return approvedCount; }
    public long getApprovedFutureCount() { return approvedFutureCount; }
    public long getCompletedCount() { return completedCount; }
    public long getCancelledCount() { return cancelledCount; }
    public long getTotalCount() { return totalCount; }
}
