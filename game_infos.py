import inspect
import json
import os

root = os.path.dirname(os.path.abspath(inspect.getfile(inspect.currentframe())))

with open(os.path.join(root, 'static', 'games', 'games.json'), encoding='utf8') as f:
    content = f.read()
    game_infos = json.loads(content)

category_counts = {}
genre_labels = game_infos.get('categoryLabels', {})
category_order = game_infos.get('categoryOrder', [])

for identifier, game_info in game_infos['games'].items():
    category = game_info.get('category') or 'UNC'
    game_info['category'] = category
    game_info['categoryLabel'] = game_info.get('categoryLabel') or genre_labels.get(category, '未分类')
    category_counts[category] = category_counts.get(category, 0) + 1

if 'UNC' in category_counts and 'UNC' not in category_order:
    category_order.append('UNC')

categories = [
    {
        'code': code,
        'label': genre_labels.get(code, '未分类'),
        'count': category_counts.get(code, 0),
    }
    for code in category_order
    if category_counts.get(code, 0) > 0
]

game_infos_with_cover = list()
for identifier, game_info in game_infos['games'].items():
    if 'coverFilename' in game_info.keys():
        game_infos_with_cover.append(game_info)
