/**
 * WordPress dependencies
 */
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import PagePatterns from '../page-patterns';
import DataviewsPatterns from '../page-patterns/dataviews-patterns';
import PageTemplateParts from '../page-template-parts';
import PageTemplates from '../page-templates';
import PagePages from '../page-pages';
import PageStyles from '../page-styles';
import { unlock } from '../../lock-unlock';

const { useLocation } = unlock( routerPrivateApis );

export default function PageMain() {
	const {
		params: { path },
	} = useLocation();

	if ( path === '/wp_template/all' ) {
		return <PageTemplates />;
	} else if ( path === '/wp_template_part/all' ) {
		return <PageTemplateParts />;
	} else if ( path === '/patterns' ) {
		return window?.__experimentalAdminViews ? (
			<DataviewsPatterns />
		) : (
			<PagePatterns />
		);
		return <PagePatterns />;
	} else if ( path === '/wp_global_styles' ) {
		return <PageStyles />;
	} else if ( window?.__experimentalAdminViews && path === '/pages' ) {
		return <PagePages />;
	}

	return null;
}
