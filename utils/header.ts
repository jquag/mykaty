import type { ReactElement } from "react";

// iOS 26 wraps header bar items in a shared glass capsule; custom items can opt out of it
function plainItem(element: ReactElement) {
	return () => [{ type: 'custom' as const, element, hidesSharedBackground: true }];
}

export function headerButtons({ left, right }: { left?: ReactElement; right?: ReactElement }) {
	return {
		headerLeft: left ? () => left : undefined,
		headerRight: right ? () => right : undefined,
		unstable_headerLeftItems: left ? plainItem(left) : undefined,
		unstable_headerRightItems: right ? plainItem(right) : undefined,
	};
}
