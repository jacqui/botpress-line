'use strict'

module.exports = function(bp, messenger) {
  
  return {
    getUserProfile: Promise.method((userId) => {
      return line.getUserProfile(userId)
      .then((profile) => {
        return bp.db.saveUser({
          id: profile.userId,
          platform: 'line',
          display_name: profile.displayName,
          picture_url: profile.pictureUrl,
          status_message: profile.statusMessage
        }).return(profile)
      })
    })
  }
}
