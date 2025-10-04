/**
 * Test file combining good (modern) and bad (legacy) baseline features
 * This file intentionally mixes patterns to test the RAG engine's ability
 * to distinguish between what needs upgrading and what's already modern
 */

// ❌ BAD: Legacy var declarations (should suggest const/let)
var userName = 'John Doe';
var userAge = 25;
var isActive = true;

