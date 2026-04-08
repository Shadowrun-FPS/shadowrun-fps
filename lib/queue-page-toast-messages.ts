/**
 * User-facing titles/descriptions for queue page API errors.
 * Keeps copy consistent and friendly across join, leave, launch, and registration.
 */

function normalizeMessage(message?: string): string {
  return (message ?? "").trim();
}

export function joinQueueErrorToast(
  status: number,
  apiMessage?: string,
): { title: string; description: string } {
  const msg = normalizeMessage(apiMessage);
  const lower = msg.toLowerCase();

  if (status === 401) {
    return {
      title: "Sign in required",
      description: "Please sign in again to join a queue.",
    };
  }
  if (status === 429) {
    return {
      title: "Too many attempts",
      description: "Please wait a moment before trying again.",
    };
  }
  if (status === 404) {
    if (lower.includes("queue")) {
      return {
        title: "Queue unavailable",
        description:
          "This queue may have been removed. Refresh the page to see current queues.",
      };
    }
    return {
      title: "Complete registration",
      description:
        msg ||
        "Register for ranked and the correct queue size (for example 4v4) before joining.",
    };
  }

  if (lower.includes("already in an active match")) {
    return {
      title: "Finish your current match",
      description:
        msg ||
        "Leave or complete your in-progress match before joining a queue.",
    };
  }

  if (msg) {
    return {
      title: "Can't join this queue",
      description: msg,
    };
  }

  return {
    title: "Can't join this queue",
    description: "Something went wrong. Please try again in a moment.",
  };
}

export function leaveQueueErrorToast(
  status: number,
  apiMessage?: string,
): { title: string; description: string } {
  const msg = normalizeMessage(apiMessage);

  if (status === 401) {
    return {
      title: "Sign in required",
      description: "Please sign in again to leave the queue.",
    };
  }
  if (status === 429) {
    return {
      title: "Too many attempts",
      description: "Please wait a moment before trying again.",
    };
  }
  if (status === 400 && msg.toLowerCase().includes("not in queue")) {
    return {
      title: "Already left",
      description:
        "You're not in this queue anymore. Refresh the page if this looks wrong.",
    };
  }
  if (msg) {
    return { title: "Couldn't leave queue", description: msg };
  }
  return {
    title: "Couldn't leave queue",
    description: "Something went wrong. Please try again.",
  };
}

export function launchMatchErrorToast(
  status: number,
  apiMessage?: string,
): { title: string; description: string } {
  const msg = normalizeMessage(apiMessage);
  const lower = msg.toLowerCase();

  if (status === 401 || lower.includes("must be signed in")) {
    return {
      title: "Sign in required",
      description: "Sign in to launch a match.",
    };
  }
  if (status === 403 || lower.includes("don't have permission")) {
    return {
      title: "Not allowed",
      description:
        "You don't have permission to launch this match. Ask a moderator or GM.",
    };
  }
  if (status === 404) {
    return {
      title: "Queue not found",
      description: "This queue no longer exists. Try refreshing the page.",
    };
  }
  if (lower.includes("need") && lower.includes("player")) {
    return { title: "Not enough players", description: msg };
  }
  if (msg) {
    return { title: "Can't launch match", description: msg };
  }
  return {
    title: "Can't launch match",
    description: "Something went wrong. Please try again.",
  };
}

export function registrationErrorToast(
  status: number,
  apiMessage?: string,
): { title: string; description: string } {
  const msg = normalizeMessage(apiMessage);

  if (status === 401) {
    return {
      title: "Sign in required",
      description: "Sign in to register for ranked matchmaking.",
    };
  }
  if (status === 429) {
    return {
      title: "Too many attempts",
      description: "Wait a moment and try again.",
    };
  }
  if (msg) {
    return { title: "Registration issue", description: msg };
  }
  return {
    title: "Registration issue",
    description: "Something went wrong. Please try again.",
  };
}

export function queueApiNetworkErrorToast(): {
  title: string;
  description: string;
} {
  return {
    title: "Connection problem",
    description:
      "Check your internet connection and try again. If it keeps happening, refresh the page.",
  };
}

/** Fill queue (admin) — `/api/queues/[id]/fill` */
export function adminFillQueueErrorToast(
  status: number,
  apiMessage?: string,
): { title: string; description: string } {
  const msg = normalizeMessage(apiMessage);
  const lower = msg.toLowerCase();

  if (status === 401) {
    return {
      title: "Sign in required",
      description: "Sign in again to use admin queue tools.",
    };
  }
  if (status === 403) {
    return {
      title: "Not allowed",
      description: msg || "You don't have permission to fill queues.",
    };
  }
  if (status === 429) {
    return {
      title: "Too many attempts",
      description: "Wait a moment and try again.",
    };
  }
  if (status === 404) {
    if (lower.includes("no eligible")) {
      return {
        title: "No players to add",
        description:
          msg ||
          "No registered players match this queue's ELO range and team size.",
      };
    }
    return {
      title: "Queue not found",
      description: msg || "This queue may have been deleted. Refresh the page.",
    };
  }
  if (status === 400) {
    return {
      title: "Invalid request",
      description: msg || "Check the queue ID and try again.",
    };
  }
  if (msg) {
    return { title: "Couldn't fill queue", description: msg };
  }
  return {
    title: "Couldn't fill queue",
    description: "Something went wrong. Try again.",
  };
}

/** Clear queue (admin) — `/api/queues/[id]/clear` */
export function adminClearQueueErrorToast(
  status: number,
  apiMessage?: string,
): { title: string; description: string } {
  const msg = normalizeMessage(apiMessage);
  const lower = msg.toLowerCase();

  if (status === 401) {
    return {
      title: "Sign in required",
      description: "Sign in again to clear queues.",
    };
  }
  if (status === 403 || lower.includes("don't have permission")) {
    return {
      title: "Not allowed",
      description: msg || "You don't have permission to clear this queue.",
    };
  }
  if (status === 429) {
    return {
      title: "Too many attempts",
      description: "Wait a moment and try again.",
    };
  }
  if (status === 400) {
    if (lower.includes("failed to clear")) {
      return {
        title: "Nothing to clear",
        description:
          "The queue may already be empty, or it was updated by someone else. Refresh if needed.",
      };
    }
    return { title: "Couldn't clear queue", description: msg };
  }
  if (msg) {
    return { title: "Couldn't clear queue", description: msg };
  }
  return {
    title: "Couldn't clear queue",
    description: "Something went wrong. Try again.",
  };
}

/** Save map pool — `/api/admin/queues/[id]/map-pool` PATCH */
export function adminMapPoolErrorToast(
  status: number,
  apiMessage?: string,
): { title: string; description: string } {
  const msg = normalizeMessage(apiMessage);
  const lower = msg.toLowerCase();

  if (status === 401) {
    return {
      title: "Sign in required",
      description: "Sign in again to update map pools.",
    };
  }
  if (status === 403) {
    return {
      title: "Not allowed",
      description:
        msg || "You don't have permission to edit this queue's map pool.",
    };
  }
  if (status === 429) {
    return {
      title: "Too many attempts",
      description: "Wait a moment and try again.",
    };
  }
  if (status === 404) {
    return {
      title: "Queue not found",
      description: msg || "This queue may have been removed.",
    };
  }
  if (status === 400) {
    if (lower.includes("mappool")) {
      return { title: "Invalid map data", description: msg };
    }
    return {
      title: "Invalid request",
      description: msg || "Check your map selection and try again.",
    };
  }
  if (msg) {
    return { title: "Couldn't save map pool", description: msg };
  }
  return {
    title: "Couldn't save map pool",
    description: "Something went wrong. Try again.",
  };
}

/** Delete queue — `/api/queues/[id]` DELETE */
export function adminDeleteQueueErrorToast(
  status: number,
  apiMessage?: string,
): { title: string; description: string } {
  const msg = normalizeMessage(apiMessage);
  const lower = msg.toLowerCase();

  if (status === 401) {
    return {
      title: "Sign in required",
      description: "Sign in again to delete queues.",
    };
  }
  if (status === 403 || lower.includes("not authorized")) {
    return {
      title: "Not allowed",
      description: msg || "You don't have permission to delete this queue.",
    };
  }
  if (status === 429) {
    return {
      title: "Too many attempts",
      description: "Wait a moment and try again.",
    };
  }
  if (status === 404) {
    return {
      title: "Queue not found",
      description: msg || "This queue may already be deleted. Refresh the page.",
    };
  }
  if (status === 400) {
    return {
      title: "Invalid request",
      description: msg || "Check the queue and try again.",
    };
  }
  if (msg) {
    return { title: "Couldn't delete queue", description: msg };
  }
  return {
    title: "Couldn't delete queue",
    description: "Something went wrong. Try again.",
  };
}
