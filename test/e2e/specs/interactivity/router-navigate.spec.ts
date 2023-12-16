/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';

test.describe( 'Router navigate', () => {
	test.beforeAll( async ( { interactivityUtils: utils } ) => {
		await utils.activatePlugins();
		const link2 = await utils.addPostWithBlock( 'test/router-navigate', {
			alias: 'router navigate - link 2',
			attributes: { title: 'Link 2' },
		} );
		const link1 = await utils.addPostWithBlock( 'test/router-navigate', {
			alias: 'router navigate - link 1',
			attributes: {
				title: 'Link 1',
				state: { prop1: 'link 1', prop3: 'link 1' },
			},
		} );
		await utils.addPostWithBlock( 'test/router-navigate', {
			alias: 'router navigate - main',
			attributes: {
				title: 'Main',
				links: [ link1, link2 ],
				state: { prop1: 'main', prop2: 'main' },
			},
		} );
	} );

	test.beforeEach( async ( { interactivityUtils: utils, page } ) => {
		await page.goto( utils.getLink( 'router navigate - main' ) );
	} );

	test.afterAll( async ( { interactivityUtils: utils } ) => {
		await utils.deactivatePlugins();
		await utils.deleteAllPosts();
	} );

	test( 'should update the HTML only for the latest navigation', async ( {
		page,
		interactivityUtils: utils,
	} ) => {
		const link1 = utils.getLink( 'router navigate - link 1' );
		const link2 = utils.getLink( 'router navigate - link 2' );

		const navigations = page.getByTestId( 'router navigations' );
		const status = page.getByTestId( 'router status' );
		const title = page.getByTestId( 'title' );

		await expect( navigations ).toHaveText( '0' );
		await expect( status ).toHaveText( 'idle' );

		let resolveLink1: Function;
		let resolveLink2: Function;

		await page.route( link1, async ( route ) => {
			await new Promise( ( r ) => ( resolveLink1 = r ) );
			await route.continue();
		} );
		await page.route( link2, async ( route ) => {
			await new Promise( ( r ) => ( resolveLink2 = r ) );
			await route.continue();
		} );

		await page.getByTestId( 'link 1' ).click();
		await page.getByTestId( 'link 2' ).click();

		await expect( navigations ).toHaveText( '2' );
		await expect( status ).toHaveText( 'busy' );
		await expect( title ).toHaveText( 'Main' );

		await Promise.resolve().then( () => resolveLink2() );

		await expect( navigations ).toHaveText( '1' );
		await expect( status ).toHaveText( 'busy' );
		await expect( title ).toHaveText( 'Link 2' );

		await Promise.resolve().then( () => resolveLink1() );

		await expect( navigations ).toHaveText( '0' );
		await expect( status ).toHaveText( 'idle' );
		await expect( title ).toHaveText( 'Link 2' );
	} );

	test( 'should update the URL from the last navigation if only varies in the URL fragment', async ( {
		page,
		interactivityUtils: utils,
	} ) => {
		const link1 = utils.getLink( 'router navigate - link 1' );

		const navigations = page.getByTestId( 'router navigations' );
		const status = page.getByTestId( 'router status' );
		const title = page.getByTestId( 'title' );

		await expect( navigations ).toHaveText( '0' );
		await expect( status ).toHaveText( 'idle' );

		const resolvers: Function[] = [];

		await page.route( link1, async ( route ) => {
			await new Promise( ( r ) => resolvers.push( r ) );
			await route.continue();
		} );

		await page.getByTestId( 'link 1' ).click();
		await page.getByTestId( 'link 1 with hash' ).click();

		const href = ( await page
			.getByTestId( 'link 1 with hash' )
			.getAttribute( 'href' ) ) as string;

		await expect( navigations ).toHaveText( '2' );
		await expect( status ).toHaveText( 'busy' );
		await expect( title ).toHaveText( 'Main' );

		resolvers.pop()!();

		await expect( navigations ).toHaveText( '1' );
		await expect( status ).toHaveText( 'busy' );
		await expect( title ).toHaveText( 'Link 1' );
		await expect( page ).toHaveURL( href );

		resolvers.pop()!();

		await expect( navigations ).toHaveText( '0' );
		await expect( status ).toHaveText( 'idle' );
		await expect( title ).toHaveText( 'Link 1' );
		await expect( page ).toHaveURL( href );
	} );

	test( 'should reload the next page when the timeout ends', async ( {
		page,
		interactivityUtils: utils,
	} ) => {
		const link1 = utils.getLink( 'router navigate - link 1' );

		const title = page.getByTestId( 'title' );
		const toggleTimeout = page.getByTestId( 'toggle timeout' );

		let resolver: Function;

		await page.route( link1, async ( route ) => {
			// Only capture the first request.
			if ( ! resolver ) {
				await new Promise( ( r ) => ( resolver = r ) );
				await route.abort();
			} else {
				await route.continue();
			}
		} );

		await expect( toggleTimeout ).toHaveText( 'Timeout 10000' );

		// Set timeout to 0.
		await toggleTimeout.click();
		await expect( toggleTimeout ).toHaveText( 'Timeout 0' );

		// Navigation should timeout almost instantly.
		await page.getByTestId( 'link 1' ).click();

		await expect( page ).toHaveURL( link1 );
		await expect( title ).toHaveText( 'Link 1' );

		// If timeout is 10000, that means the page has been reloaded.
		await expect( toggleTimeout ).toHaveText( 'Timeout 10000' );

		// Make the fetch abort, just in case.
		resolver!();
	} );

	test( 'should overwrite the state with the one serialized in the new page', async ( {
		page,
	} ) => {
		const prop1 = page.getByTestId( 'prop1' );
		const prop2 = page.getByTestId( 'prop2' );
		const prop3 = page.getByTestId( 'prop3' );

		await expect( prop1 ).toHaveText( 'main' );
		await expect( prop2 ).toHaveText( 'main' );
		await expect( prop3 ).toBeEmpty();

		await page.getByTestId( 'link 1' ).click();

		// New values for existing properties should change.
		// Old values not overwritten should remain the same.
		// New properties should appear.
		await expect( prop1 ).toHaveText( 'link 1' );
		await expect( prop2 ).toHaveText( 'main' );
		await expect( prop3 ).toHaveText( 'link 1' );

		await page.goBack();

		// New added properties are preserved.
		await expect( prop1 ).toHaveText( 'main' );
		await expect( prop2 ).toHaveText( 'main' );
		await expect( prop3 ).toHaveText( 'link 1' );
	} );
} );
