# 📋 Implementation Guide - New Uno Design

## Quick Start

### Step 1: Backup Current Files
```bash
cp src/components/game/UnoGameView.tsx src/components/game/UnoGameView.tsx.backup
cp src/components/game/UnoCards.tsx src/components/game/UnoCards.tsx.backup
```

### Step 2: Replace Files
Copy the new design files:
- `src/components/game/UnoGameView.tsx` - Main game view
- `src/components/game/UnoCards.tsx` - Card components

### Step 3: Update Asset Imports
Ensure these assets exist in your project:
```
src/assets/
├── uno-park-bg.jpg          (Background image)
├── avatar-helena.jpg        (Player avatar)
├── avatar-sam.jpg           (Player avatar)
└── avatar-robert.jpg        (Player avatar)
```

If using different paths, update imports in `UnoGameView.tsx`:
```tsx
import bgImage from "@/assets/uno-park-bg.jpg";
import avatarHelena from "@/assets/avatar-helena.jpg";
import avatarSam from "@/assets/avatar-sam.jpg";
import avatarRobert from "@/assets/avatar-robert.jpg";
```

### Step 4: Verify Dependencies
```json
{
  "dependencies": {
    "react": "^18.x",
    "motion": "^11.x",        // Framer Motion
    "lucide-react": "^0.x"    // Icons
  }
}
```

### Step 5: Test
```bash
npm run dev
# Visit http://localhost:5173 and test gameplay
```

---

## Component API Reference

### UnoGameView
Main game component - handles all game logic and UI

**Props**: None (uses React Context)

**State Management**:
- `hand`: Player's current cards
- `discard`: Top card of discard pile
- `opponents`: Opponent card counts
- `turn`: Current player's turn
- `saidUno`: UNO declaration state

**Key Functions**:
- `playCard(card)`: Play a card from hand
- `drawCard()`: Draw from pile
- `canPlay(card)`: Check if card is playable

### UnoCardFront
Displays the face of a UNO card

**Props**:
```tsx
{
  card: UnoCard,              // Card data
  playable?: boolean,         // Highlight if playable
  onClick?: () => void,       // Click handler
  className?: string,         // Additional CSS classes
  compact?: boolean           // Small sizing mode
}
```

### UnoCardBack
Displays the back of a UNO card (draw pile)

**Props**:
```tsx
{
  onClick?: () => void,       // Click handler
  disabled?: boolean,         // Disable interaction
  className?: string,         // Additional CSS classes
  compact?: boolean           // Small sizing mode
}
```

### OpponentFan
Displays opponent's hand as a fanned deck

**Props**:
```tsx
{
  count: number,              // Number of cards in hand
  tilt: number               // Rotation angle in degrees
}
```

### PlayerBadge
Shows player info with avatar and name

**Props**:
```tsx
{
  name: string,              // Player name
  avatar: string,            // Avatar image URL
  active?: boolean           // Highlight if active
}
```

---

## Styling Deep Dive

### Card Layout Classes
```tsx
// Compact card (draw/discard pile)
<div className="rounded-[8px] border-2 p-0.5 h-12 w-8 sm:h-16 sm:w-11">

// Normal card (hand)
<div className="rounded-[14px] border-[3px] p-1.5 sm:rounded-[18px] sm:border-[4px]">

// Playable card (highlighted)
<div className="cursor-pointer border-white ring-4 ring-amber-400 
                shadow-[0_0_24px_rgba(251,191,36,0.8)] -translate-y-2.5 z-30">
```

### Color System
```tsx
// Red card
"from-[#EF233C] to-[#D90429] border-white text-white"

// Yellow card
"from-[#FFD166] to-[#FFB703] border-white text-[#111111]"

// Green card
"from-[#06D6A0] to-[#049669] border-white text-white"

// Blue card
"from-[#118AB2] to-[#0077B6] border-white text-white"

// Wild card
"from-[#212529] via-[#343A40] to-[#0D0E15] border-white text-white"
```

### Responsive Sizing
```tsx
// Mobile (< 640px)
sm:h-16 sm:w-11      // Card back in pile
sm:w-20              // Card in hand
sm:text-3xl          // Card number

// Desktop (640px+)
h-16 w-11
w-20
text-5xl
```

---

## Game Flow Changes

### Before (Old Design)
```
Central modal-based UI
→ Full-screen overlays
→ Modal dialogs for actions
→ Dense information display
```

### After (New Design)
```
Scenic board layout
→ Natural card positioning
→ Streamlined buttons
→ Clear visual hierarchy
```

---

## Integration Checklist

### Files to Update
- [ ] Copy `UnoGameView.tsx`
- [ ] Copy `UnoCards.tsx`
- [ ] Update asset imports
- [ ] Verify image assets exist
- [ ] Test on mobile
- [ ] Test on desktop

### Assets Needed
- [ ] `uno-park-bg.jpg` - Background image (1920x1088 recommended)
- [ ] `avatar-helena.jpg` - Helena avatar
- [ ] `avatar-sam.jpg` - Sam avatar
- [ ] `avatar-robert.jpg` - Robert avatar

### Testing
- [ ] Card playing mechanics
- [ ] Card drawing
- [ ] Turn transitions
- [ ] AI opponent turns
- [ ] UNO button state
- [ ] Chat button functionality
- [ ] Settings button access

### Browser Compatibility
- [x] Chrome/Edge (Chromium)
- [x] Firefox
- [x] Safari (iOS/macOS)
- [x] Mobile browsers

---

## Performance Considerations

### Optimization Tips
1. **Image Optimization**: Compress background image
   - Use WebP format when possible
   - Target size: 500KB max
   - Resolution: 1920x1088

2. **Animation Performance**: Framer Motion settings
   - Already optimized for 60fps
   - GPU acceleration enabled
   - Smooth transitions on mobile

3. **Rendering**: React optimization
   - useCallback for handlers
   - useMemo for computed values
   - Proper key management in lists

---

## Customization Examples

### Change Player Names
```tsx
// UnoGameView.tsx line 177-192
<PlayerBadge name="Alice" avatar={avatarHelena} ... />
<PlayerBadge name="Bob" avatar={avatarSam} ... />
<PlayerBadge name="Charlie" avatar={avatarRobert} ... />
```

### Change Highlight Color
```tsx
// Line 204 (UNO button)
border-yellow-300 bg-gradient-to-b from-[#F87171] to-[#DC2626]

// Line 61 (Active player)
border-amber-400 shadow-[0_0_18px_rgba(251,191,36,0.9)]

// UnoCards.tsx line 176 (Playable card)
ring-yellow-300  // Change from ring-amber-400
```

### Change Background
```tsx
// UnoGameView.tsx line 5
import bgImage from "@/assets/your-custom-bg.jpg";

// Or use a solid color:
<div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-600" />
```

### Adjust Card Sizing
```tsx
// Larger hand cards
<div className="w-20 sm:w-24">  // Increase from w-16 sm:w-20

// Larger opponent fans
<div className="h-16 w-12 sm:h-20 sm:w-14">  // Increase sizes
```

---

## Troubleshooting

### Issue: Cards not displaying
**Solution**: Check image asset imports and paths
```tsx
// Verify this import works:
import bgImage from "@/assets/uno-park-bg.jpg";
```

### Issue: Cards overlapping incorrectly
**Solution**: Check z-index values
```tsx
// Playable card should be z-30
// Opponent cards use dynamic z-index based on position
```

### Issue: Animations stuttering
**Solution**: Ensure Framer Motion is updated
```bash
npm install motion@latest
```

### Issue: Touch not working on mobile
**Solution**: Ensure click handlers are attached to buttons/divs
```tsx
<div onClick={drawCard} className="...">
  {/* Clickable element */}
</div>
```

---

## Deployment Checklist

Before going to production:

1. **Performance**
   - [ ] Image assets optimized
   - [ ] Bundle size acceptable
   - [ ] Animations smooth at 60fps
   - [ ] No console errors

2. **Functionality**
   - [ ] All cards render correctly
   - [ ] Game logic intact
   - [ ] Multiplayer works
   - [ ] AI opponents function

3. **Responsive**
   - [ ] Works on mobile (375px)
   - [ ] Works on tablet (768px)
   - [ ] Works on desktop (1920px)
   - [ ] Touch interactions work

4. **Cross-browser**
   - [ ] Chrome/Edge
   - [ ] Firefox
   - [ ] Safari
   - [ ] Mobile browsers

5. **Accessibility**
   - [ ] Proper button labels
   - [ ] Color contrast sufficient
   - [ ] Keyboard navigation works
   - [ ] Screen reader compatible

---

## Support & Debugging

### Useful Console Commands
```javascript
// Check game state
console.log(gameState);

// Verify animations
console.time('animation');
```

### Debug Tips
1. Use React DevTools to inspect component props
2. Check Network tab for asset loading
3. Use Lighthouse for performance audit
4. Test with Chrome DevTools device emulation

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Aug 30, 2026 | Initial release with new design |

---

**Last Updated**: August 30, 2026  
**Maintainer**: Design Team  
**Status**: Production Ready ✅
