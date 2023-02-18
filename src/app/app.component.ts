import { Component, OnDestroy, OnInit } from '@angular/core';
import { Functions } from '@angular/fire/functions';
import { FormControl } from '@angular/forms';
import { httpsCallable } from '@firebase/functions';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styles: []
})
export class AppComponent implements OnDestroy, OnInit {
	title = 'skywise';
	controller = new FormControl('', { nonNullable: true });
	subscriptions: Subscription[] = [];
	links: { href?: string; name?: string }[] = [];

	constructor(private functions: Functions) {
		const pastValue = localStorage.getItem('html');
		this.controller.setValue(pastValue || '');
	}

	ngOnInit(): void {
		const cacheLinks = localStorage.getItem('links');
		if (cacheLinks) {
			this.links = JSON.parse(cacheLinks);
			console.log(`Total links cached: ${this.links.length}`);
		}
	}

	async scrape(): Promise<void> {
		const getSitemapLinks = httpsCallable<string, {links: { href?: string; name?: string }[], nextPage: string}>(this.functions, 'getSitemapLinks', { timeout: 540 * 1000 });
		const res = await getSitemapLinks(this.controller.value);
		console.log(res);
		this.links.push(...res.data.links)
		localStorage.setItem('links', JSON.stringify(this.links));
		if (res.data.nextPage) this.controller.setValue(res.data.nextPage);
	}

	ngOnDestroy(): void {
		this.subscriptions.forEach(s => s.unsubscribe());
	}
	
}
