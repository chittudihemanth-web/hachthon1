// backend/src/services/dispatcher.ts
export class DispatcherService {
  async dispatch(
    type: 'slack' | 'crm_update' | 'webhook_relay' | 'email_draft' | 'database_write',
    payload: Record<string, unknown>,
    endpoint?: string
  ): Promise<{ success: boolean; target: string; message: string; timestamp: string }> {
    const timestamp = new Date().toISOString();

    if (endpoint && endpoint.startsWith('http')) {
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        return {
          success: res.ok,
          target: endpoint,
          message: `Dispatched HTTP payload with status ${res.status}`,
          timestamp,
        };
      } catch (err: any) {
        console.warn(`[DispatcherService] HTTP dispatch failed to ${endpoint}:`, err.message);
      }
    }

    // Default simulated dispatch
    return {
      success: true,
      target: endpoint || `${type}://default-target`,
      message: `Simulated dispatch of payload to ${type} completed successfully.`,
      timestamp,
    };
  }
}

export const dispatcherService = new DispatcherService();
