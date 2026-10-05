export const userRoles = Object.freeze({
  parent: "parent",
  admin: "admin"
});

export const sessionModes = Object.freeze({
  parent: "parent",
  child: "child"
});

export const ageBands = Object.freeze(["3-4", "4-5", "5-6"]);

export const dialects = Object.freeze(["north", "central", "south"]);

export const contentStatuses = Object.freeze(["draft", "published", "archived"]);

export const reviewStatuses = Object.freeze(["needs_review", "approved"]);

export const exerciseTypes = Object.freeze([
  "identify-letter",
  "match-rime",
  "listen-word",
  "select-tone",
  "listen-animal"
]);

export const learningSessionTypes = Object.freeze(["alphabet", "spelling", "story", "quiz"]);

export const permissionLevels = Object.freeze({
  public: "PUB",
  authenticated: "AUTH",
  child: "CHILD",
  parent: "PARENT",
  admin: "ADMIN"
});
