import { debounce } from './debounce.js';
import { renderSingleVidReq } from './renderSingleVideoElm.js';
import dataService from './dataService.js';
import { checkValidation } from './checkValidation.js';
import api from './api.js';

const SUPER_USER_ID = '19900411';
export const state = {
    sortBy: 'newFirst',
    searchTerm: '',
    filterBy: 'all',
    userId: '',
    isSuperUser: false
};






document.addEventListener('DOMContentLoaded', function() {
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

    dataService.loadAllVidReqs();

    sortByElms.forEach(elm => {
        elm.addEventListener('click', function(e) {
            e.preventDefault();
            state.sortBy = this.querySelector('input').value;
            console.log(state.sortBy);
            dataService.loadAllVidReqs(state.sortBy, state.searchTerm, state.filterBy);
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
        elm.addEventListener('click', function(e) {
            e.preventDefault();
            state.filterBy = e.target.getAttribute('id').split('_')[2];
            dataService.loadAllVidReqs(state.sortBy, state.searchTerm, state.filterBy);
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

        dataService.loadAllVidReqs(state.sortBy, state.searchTerm, state.filterBy);
    }, 300));


    formVidReqElm.addEventListener('submit', (e) => {
        e.preventDefault();

        const formData = new FormData(formVidReqElm);
        formData.append('author_id', state.userId);

        const isValid = checkValidation(formData);

        if (!isValid) {
            return;
        }

        dataService.addVidReq(formData).then((data) => {
            renderSingleVidReq(data, state, true);
            console.log(data);
        })
    })
})