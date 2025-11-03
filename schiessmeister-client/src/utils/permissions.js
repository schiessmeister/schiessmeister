/**
 * Permission utility functions for determining user access levels
 */

/**
 * Check if user is owner of the organization that owns the competition
 * @param {Object} competition - Competition object with organizationId
 * @param {Array} ownedOrganizations - Array of organizations owned by the user
 * @returns {boolean}
 */
export const isCompetitionOwner = (competition, ownedOrganizations) => {
	if (!competition || !Array.isArray(ownedOrganizations)) return false;
	return ownedOrganizations.some((org) => org.id === competition.organizationId);
};

/**
 * Check if user is a recorder/writer for the competition
 * @param {Object} competition - Competition object with recorders array
 * @param {string|number} userId - Current user's ID
 * @returns {boolean}
 */
export const isCompetitionRecorder = (competition, userId) => {
	if (!competition || !userId || !Array.isArray(competition.recorders)) return false;
	return competition.recorders.some((recorder) => String(recorder.id) === String(userId));
};

/**
 * Check if user can edit competition metadata (only owners)
 * @param {Object} competition
 * @param {Array} ownedOrganizations
 * @returns {boolean}
 */
export const canEditCompetitionMeta = (competition, ownedOrganizations) => {
	return isCompetitionOwner(competition, ownedOrganizations);
};

/**
 * Check if user can edit participations and points (owners or recorders)
 * @param {Object} competition
 * @param {Array} ownedOrganizations
 * @param {string|number} userId
 * @returns {boolean}
 */
export const canEditParticipations = (competition, ownedOrganizations, userId) => {
	return isCompetitionOwner(competition, ownedOrganizations) || isCompetitionRecorder(competition, userId);
};

/**
 * Check if user has any access to the competition
 * (owner, recorder, or has participation)
 * TODO: Add only participation check
 * @param {Object} competition
 * @param {Array} ownedOrganizations
 * @param {string|number} userId
 * @returns {boolean}
 */
export const hasCompetitionAccess = (competition, ownedOrganizations, userId) => {
	// Currently competitions are only visible if user is owner or recorder
	// because that's all we fetch from the backend
	return isCompetitionOwner(competition, ownedOrganizations) || isCompetitionRecorder(competition, userId);
};
