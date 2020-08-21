import { renderSingleVidReq } from './renderSingleVideoElm.js';
import { state } from './client.js';
import api from './api.js';

export default {

    addVidReq: (formData) => {
        return api.videoReq.post(formData);
    },

    deleteVidReq: (id) => {
        return api.videoReq.delete(id)
            .then(() => {
                window.location.reload();
            });

    },

    updateVideoStatus: (videoId, status, videoResValue = '') => {
        return api.videoReq.update(videoId, status, videoResValue)
            .then(() => {
                window.location.reload();
            })
    },

    loadAllVidReqs: (sortBy = 'newFirst', searchTerm = '', filterBy = 'all', localState = state) => {
        const listOfVidElm = document.getElementById('listOfRequests');
        api.videoReq.get(sortBy, searchTerm, filterBy)
            .then(data => {
                listOfVidElm.innerHTML = '';
                data.forEach(vidInfo => {
                    renderSingleVidReq(vidInfo, localState, false);
                })
            });
    },

    updateVotes: (id, vote_type, user_id) => {
        return api.votes.update(id, vote_type, user_id);
    }
}