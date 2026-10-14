const React = require('react');

const FlashList = (props) => {
  const { data, renderItem, keyExtractor, ListEmptyComponent, ListHeaderComponent, ListFooterComponent } = props;
  const header = ListHeaderComponent
    ? typeof ListHeaderComponent === 'function'
      ? React.createElement(ListHeaderComponent)
      : ListHeaderComponent
    : null;
  const footer = ListFooterComponent
    ? typeof ListFooterComponent === 'function'
      ? React.createElement(ListFooterComponent)
      : ListFooterComponent
    : null;
  const empty = ListEmptyComponent
    ? typeof ListEmptyComponent === 'function'
      ? React.createElement(ListEmptyComponent)
      : ListEmptyComponent
    : null;

  return React.createElement(
    'div',
    null,
    header,
    data && data.length > 0
      ? data.map((item, index) => {
          const key = keyExtractor ? keyExtractor(item, index) : index;
          return React.createElement(React.Fragment, { key }, renderItem({ item, index }));
        })
      : empty,
    footer
  );
};

module.exports = {
  FlashList,
};
