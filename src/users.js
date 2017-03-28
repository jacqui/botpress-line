import Promise from 'bluebird'

module.exports = (bp, line) => {
  
  return {
    getUserProfile: Promise.method(userId => {
      return line.getUserProfile(userId)
      .then(profile => {

        if (!profile.userId) {
          return { userId: userId }
        }

        const bpProfile = {
          id: profile.userId,
          platform: 'line',
          first_name: profile.displayName,
          last_name: profile.displayName,
          picture_url: profile.pictureUrl,
        }

        return bp.db.saveUser(bpProfile).return(bpProfile)
      })
    })
  }

}
