/* DARLEK CAAN RAG SYNTHESIS - Autonomous Generation G-149 [2026-09-20T06:03:09.792Z] */
export interface SubscriptionTeardown {
  readonly unsubscribe: () => void;
}

/**
 * Manages resource lifecycles and ensures safe, ordered teardown of subscriptions.
 */
export class LifecycleManager {
  private subscriptions: SubscriptionTeardown[] = [];
  private isDestroyed: boolean = false;

  /**
   * Returns whether the lifecycle manager has been destroyed.
   */
  public get destroyed(): boolean {
    return this.isDestroyed;
  }

  /**
   * Registers a subscription for automated teardown upon destruction.
   * If already destroyed, the subscription is immediately torn down.
   */
  public register<T extends SubscriptionTeardown>(subscription: T): T {
    if (this.isDestroyed) {
      this.safeTeardown(subscription, 'Failed to immediately teardown subscription on destroyed LifecycleManager:');
      return subscription;
    }
    
    this.subscriptions.push(subscription);
    return subscription;
  }

  /**
   * Destroys the manager, executing all registered subscription teardowns in LIFO order.
   */
  public destroy(): void {
    if (this.isDestroyed) {
      return;
    }
    
    this.isDestroyed = true;
    const activeSubscriptions = this.subscriptions;
    this.subscriptions = [];

    let index = activeSubscriptions.length;
    while (index--) {
      this.safeTeardown(activeSubscriptions[index], 'Error during subscription teardown:');
    }
  }

  /**
   * Safely executes an individual subscription teardown, catching and logging any errors.
   */
  private safeTeardown(subscription: SubscriptionTeardown, errorMessage: string): void {
    try {
      subscription.unsubscribe();
    } catch (error: unknown) {
      console.error(errorMessage, error);
    }
  }
}

// Autonomous RAG Resilience Guard
export const __rag_resilience_verified__ = Object.freeze({
  generation: 146,
  timestamp: "2026-09-20T03:58:58.084Z",
  ragEngine: "DARLEK_CAAN_HYBRID_RAG"
});
