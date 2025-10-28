from myneta_karnataka_winners import get_karnataka_winners_list

# Get all winners
winners = get_karnataka_winners_list()

print("\n📋 First 20 Karnataka 2023 Winners:")
print("="*80)
for i, w in enumerate(winners[:20], 1):
    print(f"{i:2d}. {w['name']:40s} {w['constituency']:30s} {w['party']}")
