import { Injectable } from '@angular/core';
import { FirebaseExtendedService } from './firebase-extended.service';

type Collection = {
	name: string;
	items: Item[];
}

type Item = {
	order: number;
	link: string;
	img: string;
	name: string;
	tiers: Tier[];
}

type Tier = {
	tier: number;
	requirement: number;
	perks: {
		order: number;
		link: string;
		text: string;
	}[]
}

type Perk = {
	order: number;
	link: string;
	text: string;
}

@Injectable({
  providedIn: 'root'
})
export class ScraperService {

  constructor(private db: FirebaseExtendedService) { }

	async elaborate(html: string): Promise<void> {
		console.log('Scraping...')
		const container = document.createElement('div');
		container.innerHTML = html;
		const wikiHost = 'https://wiki.hypixel.net';
		
		const collectionsTab = container.querySelectorAll('.hp-tabcontent');

		const collections: Collection[] = [];

		collectionsTab.forEach(col => {
			const colName = col.id.replace('_Collection_', '');
			const items: Item[] = [];
			
			const itemsTable = col.querySelectorAll('.wikitable.mw-collapsible');

			itemsTable.forEach((item, itemI) => {
				const trs = item.querySelectorAll('tr');
				let itemLink: string = '';
				let itemImg: string = '';
				let itemName: string = '';
				const allTiers: Tier[] = [];

				trs.forEach((tr, trI) => {
					if (trI === 0) {
						const anchors = tr.querySelectorAll('a');

						anchors.forEach((anchor) => {
							if (!anchor.innerHTML.includes('img')) {
								itemName = anchor.innerHTML.trim();
								itemLink = (wikiHost + anchor.href).replace('http://localhost:4200', '');
							}
						})
						const itemImgEl = tr.querySelector('th img') as HTMLImageElement | null;
						if (itemImgEl) {
							itemImg = (wikiHost + itemImgEl.src).replace('http://localhost:4200', '');
						}
					} else {
						const itemTiersContainer = tr.querySelector('.wikitable');
						const itemTiers = itemTiersContainer?.querySelectorAll('tr');
		
						itemTiers?.forEach((tiers, i) => {
							if (i === 0) return;
		
							const tier = i + 1;
							let requirement = 0;
							const perks: Perk[] = [];
		
							const columns = tiers.querySelectorAll('td');
							columns.forEach((column, colI) => {
								if (colI === 0) return;
		
								if (colI === 1) {
									requirement = parseFloat(column.innerHTML.trim().replace(',', ''));
									return;
								}
		
								const tierPerks = column.querySelectorAll('a');
								tierPerks.forEach((perk, perkI) => {
									const link = (wikiHost + perk.href).replace('http://localhost:4200', '');
									const hasSpan = perk.innerHTML.includes('span');
									let text = '';

									if (hasSpan) {
										text = perk.querySelector('span')?.innerHTML || '';
									} else {
										text = perk.innerHTML;
									}
		
									perks.push({
										order: perkI,
										text: text.replace('&nbsp;', ' '),
										link,
									})
								})
							})
		
							allTiers.push({ tier, requirement, perks })
						});
					}
				});

				items.push({
					order: itemI,
					link: itemLink,
					img: itemImg,
					name: itemName,
					tiers: allTiers,
				})
			})

			collections.push({
				name: colName,
				items,
			})
		});

		await this.saveToDb(collections);
	}

	private async saveToDb(collections: Collection[]): Promise<void> {
		for (let i = 0; i < collections.length; i++) {
			const collection = collections[i];
			await this.db.upsert(`collections/${collection.name.trim().toLowerCase()}`, { name: collection.name });
			
			for (let itemsI = 0; itemsI < collection.items.length; itemsI++) {
				const item = collection.items[itemsI];
				await this.db.upsert(`collections/${collection.name.trim().toLowerCase()}/items/${item.order}`, item);
			}
		}
		console.warn('Saved');
	}
}
