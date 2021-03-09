import Page from './Page';
import GameThumbnail from '../components/GameThumbnail';
import Loader from '../components/Loader';
import Router from '../Router';
import Favoris from '../Favoris';
import GameDetails from './GameDetails';

export default class GameList extends Page {
	#games;
	page_num;
	rendered;
	constructor() {
		super('gameList');
		this.games = [];
		this.page_num = 1;
		this.rendered = [];
	}

	set games(value) {
		if (value.next == null) {
			document.onscroll = null;
		} else {
			this.page_num++;
			document.onscroll = this.loadMore;
		}
		this.#games = value.results;
		if (this.#games) {
			if (this.children instanceof Array)
				this.#games.map(game => this.children.push(new GameThumbnail(game)));
			else this.children = this.#games.map(game => new GameThumbnail(game));
		}
	}

	resetPage() {
		this.children = [];
		this.rendered = [];
		this.page_num = 1;
	}

	loadMore() {
		if (
			document.documentElement.scrollTop + window.innerHeight >=
			document.documentElement.scrollHeight
		) {
			document.documentElement.scrollTop =
				document.documentElement.scrollTop - 5;
			Router.append('/');
		}
	}

	getGames() {
		fetch(
			`https://api.rawg.io/api/games?metacritic=50,100&dates=2020,${new Date().getUTCFullYear()}&page=${
				this.page_num
			}`
		)
			.then(response => {
				if (response.status == 200) return response.json();
				else throw new Error(`Fetch error: ${response.status}`);
			})
			.then(responseJSON => {
				this.games = responseJSON;
				this.element.innerHTML = this.render();
				this.addFavorites(this.element);
				this.redirectDetails(this.element);
			})
			.catch(error => {
				console.error(error);
			});
	}

	getElement() {
		return this.element;
	}

	mount(element) {
		if (!this.rendered.includes(this.page_num)) {
			this.rendered.push(this.page_num);
			super.mount(element);
			this.element.innerHTML += new Loader().render();
			this.getGames();
		}
	}
	addFavorites(elt) {
		elt.querySelectorAll('.gameThumbnail').forEach(element => {
			element.querySelector('.favbutton').addEventListener('click', e => {
				e.preventDefault();
				const name = element.querySelector('h4');
				this.#games.forEach(game => {
					if (game.name == name.innerHTML) Favoris.addFavoris(game);
				});
			});
		});
	}
	redirectDetails(elt) {
		elt.querySelectorAll('.gameThumbnail').forEach(element => {
			element.querySelector('.card-content').addEventListener('click', e => {
				document.onscroll = null;
				console.log(element.getAttribute('id'));
				const gameDetails = new GameDetails(element.getAttribute('id'));
				Router.routes.push({
					path: `/detail-${element.getAttribute('id')}`,
					page: gameDetails,
					title: 'Details',
				});
				Router.navigate(`/detail-${element.getAttribute('id')}`);
			});
		});
	}
}
