const listOfVidElm = document.getElementById('listOfRequests');
SUPER_USER_ID = '19900411';
const state = {
    sortBy: 'newFirst',
    searchTerm: '',
    filterBy: 'all',
    userId: '',
    isSuperUser: false
};

function renderSingleVidReq(vidInfo, isPrepend) {
    const vidReqTemplate = `
    <div class="card mb-3">
         ${ state.isSuperUser ? `<div class="card-header d-flex justify-content-between">
            <select id="admin_change_status_${vidInfo._id}">
                <option value="new">New</option>
                <option value="planned">Planned</option>
                <option value="done">Done</option>
            </select>
            <div class="input-group ml-2 mr-5 ${vidInfo.status != 'done' ? 'd-none' : ''}" id="admin_video_res_container_${vidInfo._id}">
                <input type="text" id="admin_video_res_${vidInfo._id}" class="form-control" placeholder="Paste here youtube video link" />
                <div class="input-group-append">
                    <button class="btn btn-outline-secondary" id="admin_save_video_res_${vidInfo._id}" type="button">Save</button>
                </div>
            </div>
            <button class="btn btn-danger" id="admin_delete_video_req_${vidInfo._id}">Delete</button>
        </div>` : ''}
        <div class="card-body d-flex justify-content-between flex-row">
            <div class="d-flex flex-column">
                <h3>${vidInfo.topic_title}</h3>
                <p class="text-muted mb-2">${vidInfo.topic_details}</p>
                <p class="mb-0 text-muted">
                    ${
        vidInfo.expected_result &&
        `<strong>Expected results:</strong> ${vidInfo.expected_result}`
        }
                </p>
            </div>
            ${ vidInfo.status == 'done' ?
            `<div class="ml-auto mr-3">
                <iframe width="240" height="135" src="https://www.youtube.com/embed/${vidInfo.video_ref.link}"
                frameborder="0" allowfullscreen></iframe>
            </div>` : ''
            }
            <div class="d-flex flex-column text-center">
                <a id="votes_ups_${vidInfo._id}" class="btn btn-link">🔺</a>
                <h3 id="score_vote_${vidInfo._id}">${vidInfo.votes.ups.length - vidInfo.votes.downs.length}</h3>
                <a id="votes_downs_${vidInfo._id}" class="btn btn-link">🔻</a>
            </div>
        </div>
        <div class="card-footer d-flex flex-row justify-content-between">
            <div class="${vidInfo.status == 'done' ? 'text-success' : vidInfo.status == 'planned' ? 'text-primary' : ''}">
                <span >${vidInfo.status.toUpperCase()} ${vidInfo.status == 'done' ? `on ${new Date(vidInfo.video_ref.date).toLocaleDateString()}` : ''}</span> &bullet; added by <strong>${vidInfo.author_name}</strong> on
                <strong>${new Date(vidInfo.submit_date).toLocaleDateString()}</strong>
            </div>
            <div class="d-flex justify-content-center flex-column 408ml-auto mr-2">
                <div class="badge badge-success">
                    ${vidInfo.target_level}
                </div>
            </div>
        </div>
    </div>`;
    const vidReqContainerElm = document.createElement('div');
    vidReqContainerElm.innerHTML = vidReqTemplate;
    // return vidReqContainerElm;
    if (isPrepend) {
        listOfVidElm.prepend(vidReqContainerElm);

    } else {
        listOfVidElm.appendChild(vidReqContainerElm);
    }

    const adminChangeStatusElm = document.getElementById(`admin_change_status_${vidInfo._id}`);
    const adminVideoResElm = document.getElementById(`admin_video_res_${vidInfo._id}`);
    const adminSaveVideoResElm = document.getElementById(`admin_save_video_res_${vidInfo._id}`);
    const adminDeleteVideoReqElm = document.getElementById(`admin_delete_video_req_${vidInfo._id}`);
    const adminVideoResContainer = document.getElementById(`admin_video_res_container_${vidInfo._id}`);

    if (state.isSuperUser) {
        adminChangeStatusElm.value = vidInfo.status;
        adminVideoResElm.value = vidInfo.video_ref.link;

        adminChangeStatusElm.addEventListener('change', e => {
            if (e.target.value == 'done') {
                adminVideoResContainer.classList.remove('d-none');
            } else {
                // adminVideoResContainer.classList.add('d-none');
                updateVideoStatus(vidInfo._id, e.target.value);
            }
        })

        adminDeleteVideoReqElm.addEventListener('click', e => {
            e.preventDefault();

            const isSure = confirm(`Are you sure you want to delete "${vidInfo.topic_title}" `);
            if (!isSure) return;
            fetch('http://localhost:7777/video-request', {
                method: 'DELETE',
                headers: { 'content-Type': 'application/json' },
                body: JSON.stringify({
                    id: vidInfo._id
                })
            }).then(res => res.json())
                .then(data => {
                    console.log(data);
                    window.location.reload();
                })

        });

        adminSaveVideoResElm.addEventListener('click', e => {
            e.preventDefault();
            if (!adminVideoResElm.value) {
                adminVideoResElm.classList.add('is-invalid');
                adminVideoResElm.addEventListener('input', () => {
                    adminVideoResElm.classList.remove('is-invalid');
                });
                return;
            }
            updateVideoStatus(vidInfo._id, 'done', adminVideoResElm.value);
        })
    }

    applyVoteStyle(vidInfo._id, vidInfo.votes, vidInfo.status === 'done');

    const scoreVoteElm = document.getElementById(`score_vote_${vidInfo._id}`);
    const voteElms = document.querySelectorAll(`[id^=votes_][id$=_${vidInfo._id}]`);

    voteElms.forEach(elm => {
        if(state.isSuperUser || vidInfo.status === 'done') {
            return;
        }
        elm.addEventListener('click', function (e) {
            e.preventDefault();

            const [, vote_type, id] = e.target.getAttribute('id').split('_');
            fetch('http://localhost:7777/video-request/vote', {
                method: 'PUT',
                headers: { 'content-Type': 'application/json' },
                body: JSON.stringify({
                    id,
                    vote_type,
                    user_id: state.userId
                })
            })
                .then(blob => blob.json())
                .then(data => {
                    scoreVoteElm.innerText = data.ups.length - data.downs.length;
                    applyVoteStyle(id, data, vidInfo.status === 'done', vote_type);
                    console.log(data);
                })
        })
    })

}

function updateVideoStatus(videoId, status, videoResValue = '') {
    fetch('http://localhost:7777/video-request', {
        method: 'PUT',
        headers: { 'content-Type': 'application/json' },
        body: JSON.stringify({
            id: videoId,
            status: status,
            resVideo: videoResValue
        })
    }).then(res => res.json())
        .then(data => {
            console.log(data);
            window.location.reload();
        })
}

function applyVoteStyle(video_id, votes_list, isDisabled, vote_type) {
    const voteUpsElm = document.getElementById(`votes_ups_${video_id}`);
    const voteDownsElm = document.getElementById(`votes_downs_${video_id}`);

    if(isDisabled) {
        voteUpsElm.style.opacity = '.5';
        voteDownsElm.style.opacity = '.5';
        voteUpsElm.style.cursor = 'not-allowed';
        voteDownsElm.style.cursor = 'not-allowed';
        return;
    }
    if (!vote_type) {
        if (votes_list.ups.includes(state.userId)) {
            vote_type = 'ups';
        } else if (votes_list.downs.includes(state.userId)) {
            vote_type = 'downs';
        } else {
            return;
        }
    }

    const voteDirElm = vote_type === 'ups' ? voteUpsElm : voteDownsElm;
    const otherDirElm = vote_type === 'ups' ? voteDownsElm : voteUpsElm;

    if (votes_list[vote_type].includes(state.userId)) {

        voteDirElm.style.opacity = '1';
        otherDirElm.style.opacity = '.5';
    } else {
        otherDirElm.style.opacity = '1';
    }
}

function loadAllVidReqs(sortBy = 'newFirst', searchTerm = '', filterBy = 'all') {
    fetch(`http://localhost:7777/video-request?sortBy=${sortBy}&searchTerm=${searchTerm}&filterBy=${filterBy}`)
        .then(blob => blob.json())
        .then(data => {
            listOfVidElm.innerHTML = '';
            data.forEach(vidInfo => {
                renderSingleVidReq(vidInfo, false);
            })
        });
}

function debounce(fn, time) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn.apply(this, args), time);
    };
}

function checkValidation(formData) {
    // const name = formData.get('author_name');
    // const email = formData.get('author_email');
    const topic = formData.get('topic_title');
    const topicDetails = formData.get('topic_details');

    // if(!name) {
    //     document.querySelector('[name=author_name]').classList.add('is-invalid');
    // }

    // const emailPattern = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

    // if(!email || !emailPattern.test(email)) {
    //     document.querySelector('[name=author_email]').classList.add('is-invalid');
    // }
    // console.log(emailPattern.test(email));

    if (!topic || topic.length > 30) {
        document.querySelector('[name=topic_title]').classList.add('is-invalid');
    }
    if (!topicDetails) {
        document.querySelector('[name=topic_details]').classList.add('is-invalid');
    }

    const allInvalidElms = document.getElementById('formVideoRequest').querySelectorAll('.is-invalid');

    if (allInvalidElms.length) {
        allInvalidElms.forEach(elm => {
            elm.addEventListener('input', function () {
                this.classList.remove('is-invalid');
            })
        })
        return false;
    }

    return true;

}

document.addEventListener('DOMContentLoaded', function () {
    const formVidReqElm = document.getElementById('formVideoRequest');
    const sortByElms = document.querySelectorAll('[id*=sort_by_]');
    const searchBoxElm = document.getElementById('search_box');
    const filterByElms = document.querySelectorAll('[id*=filter_by_]');

    const formLoginElm = document.querySelector('.login-form');
    const appContentElm = document.querySelector('.app-content');

    if (window.location.search) {
        state.userId = new URLSearchParams(window.location.search).get('id');

        if (state.userId === SUPER_USER_ID) {
            state.isSuperUser = true;
            document.querySelector('.normal-user-content').classList.add('d-none');
        }
        formLoginElm.classList.add('d-none');
        appContentElm.classList.remove('d-none');
    }

    loadAllVidReqs();

    sortByElms.forEach(elm => {
        elm.addEventListener('click', function (e) {
            e.preventDefault();
            state.sortBy = this.querySelector('input').value;
            console.log(state.sortBy);
            loadAllVidReqs(state.sortBy, state.searchTerm, state.filterBy);
            console.log(this);
            this.classList.add('active');

            if (state.sortBy == 'topVotedFirst') {
                document.getElementById('sort_by_new').classList.remove('active');
            } else {
                document.getElementById('sort_by_top').classList.remove('active');
            }
        })
    })

    filterByElms.forEach(elm => {
        elm.addEventListener('click', function (e) {
            e.preventDefault();
            state.filterBy = e.target.getAttribute('id').split('_')[2];
            loadAllVidReqs(state.sortBy, state.searchTerm, state.filterBy);
            console.log(this);
            // this.classList.add('active');
            filterByElms.forEach(option => {
                option.classList.remove('active');
                this.classList.add('active');
            })
        })
    })

    searchBoxElm.addEventListener('input', debounce((e) => {
        state.searchTerm = e.target.value;

        loadAllVidReqs(state.sortBy, state.searchTerm, state.filterBy);
    }, 300)
    );


    formVidReqElm.addEventListener('submit', (e) => {
        e.preventDefault();

        const formData = new FormData(formVidReqElm);
        formData.append('author_id', state.userId);

        const isValid = checkValidation(formData);

        if (!isValid) {
            return;
        }

        fetch('http://localhost:7777/video-request', {
            method: 'POST',
            body: formData
        })
            .then(bold => bold.json())
            .then((data) => {
                renderSingleVidReq(data, true);
                console.log(data);
            })
    })
})