import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Select from '@/components/ui/Select';
import Badge from '@/components/ui/Badge';
import Checkbox from '@/components/ui/Checkbox';
import Skeleton from '@/components/ui/Skeleton';
import Tooltip from '@/components/ui/Tooltip';

describe('UI Components', () => {
  describe('Button', () => {
    it('should render button with text', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByText('Click me')).toBeDefined();
    });

    it('should call onClick handler when clicked', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click me</Button>);
      fireEvent.click(screen.getByText('Click me'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should be disabled when disabled prop is true', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByText('Disabled');
      expect(button).toHaveProperty('disabled', true);
    });

    it('should apply variant styles', () => {
      const { container } = render(<Button variant="primary">Primary</Button>);
      expect(container.querySelector('button')).toBeDefined();
    });
  });

  describe('Input', () => {
    it('should render input with placeholder', () => {
      render(<Input placeholder="Enter text" />);
      expect(screen.getByPlaceholderText('Enter text')).toBeDefined();
    });

    it('should update value on change', () => {
      const handleChange = vi.fn();
      render(<Input onChange={handleChange} />);
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'test' } });
      expect(handleChange).toHaveBeenCalled();
    });

    it('should show error state', () => {
      render(<Input error="This field is required" />);
      expect(screen.getByText('This field is required')).toBeDefined();
    });

    it('should be disabled when disabled prop is true', () => {
      render(<Input disabled />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveProperty('disabled', true);
    });
  });

  describe('Modal', () => {
    it('should render modal when open', () => {
      render(
        <Modal isOpen={true} onClose={() => {}}>
          <div>Modal Content</div>
        </Modal>
      );
      expect(screen.getByText('Modal Content')).toBeDefined();
    });

    it('should not render when closed', () => {
      const { container } = render(
        <Modal isOpen={false} onClose={() => {}}>
          <div>Modal Content</div>
        </Modal>
      );
      expect(container.textContent).toBe('');
    });

    it('should call onClose when close button is clicked', () => {
      const handleClose = vi.fn();
      render(
        <Modal isOpen={true} onClose={handleClose} title="Test Modal">
          <div>Content</div>
        </Modal>
      );
      const closeButton = screen.getByLabelText(/close/i);
      fireEvent.click(closeButton);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Select', () => {
    const options = [
      { value: '1', label: 'Option 1' },
      { value: '2', label: 'Option 2' },
      { value: '3', label: 'Option 3' },
    ];

    it('should render select with options', () => {
      render(<Select options={options} />);
      expect(screen.getByRole('combobox')).toBeDefined();
    });

    it('should call onChange when option is selected', () => {
      const handleChange = vi.fn();
      render(<Select options={options} onChange={handleChange} />);
      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: '2' } });
      expect(handleChange).toHaveBeenCalled();
    });

    it('should show placeholder when no value selected', () => {
      render(<Select options={options} placeholder="Select an option" />);
      expect(screen.getByText('Select an option')).toBeDefined();
    });

    it('should be disabled when disabled prop is true', () => {
      render(<Select options={options} disabled />);
      const select = screen.getByRole('combobox');
      expect(select).toHaveProperty('disabled', true);
    });
  });

  describe('Badge', () => {
    it('should render children', () => {
      render(<Badge>Test Badge</Badge>);
      expect(screen.getByText('Test Badge')).toBeDefined();
    });

    it('should apply variant class', () => {
      const { container } = render(<Badge variant="success">Success</Badge>);
      expect(container.querySelector('.ui-badge-success')).toBeDefined();
    });

    it('should render dot when dot prop is true', () => {
      const { container } = render(<Badge dot>Dot</Badge>);
      expect(container.querySelectorAll('span')[1]).toBeDefined();
    });
  });

  describe('Checkbox', () => {
    it('should render label', () => {
      render(<Checkbox label="Accept terms" />);
      expect(screen.getByText('Accept terms')).toBeDefined();
    });

    it('should render helper text', () => {
      render(<Checkbox label="Label" helperText="Helper" />);
      expect(screen.getByText('Helper')).toBeDefined();
    });

    it('should show error message', () => {
      render(<Checkbox label="Label" error="Required field" />);
      expect(screen.getByText('Required field')).toBeDefined();
    });

    it('should call onChange when clicked', () => {
      const handleChange = vi.fn();
      render(<Checkbox label="Check me" onChange={handleChange} />);
      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);
      expect(handleChange).toHaveBeenCalled();
    });

    it('should be disabled', () => {
      render(<Checkbox label="Disabled" disabled />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveProperty('disabled', true);
    });
  });

  describe('Skeleton', () => {
    it('should render correctly', () => {
      const { container } = render(<Skeleton width={100} height={20} />);
      const skeleton = container.querySelector('.skeleton');
      expect(skeleton).toBeDefined();
    });

    it('should apply variant class', () => {
      const { container } = render(<Skeleton variant="circular" />);
      expect(container.querySelector('.skeleton-circular')).toBeDefined();
    });
  });

  describe('Tooltip', () => {
    it('should render children', () => {
      render(
        <Tooltip content="Tooltip text">
          <button>Hover me</button>
        </Tooltip>
      );
      expect(screen.getByText('Hover me')).toBeDefined();
    });

    it('should show content on hover', async () => {
      render(
        <Tooltip content="Tooltip text" delay={0}>
          <button>Hover me</button>
        </Tooltip>
      );

      const trigger = screen.getByText('Hover me');
      fireEvent.mouseEnter(trigger);

      expect(await screen.findByText('Tooltip text')).toBeDefined();
    });

    it('should not show when disabled', () => {
      render(
        <Tooltip content="Tooltip text" disabled delay={0}>
          <button>Hover me</button>
        </Tooltip>
      );

      const trigger = screen.getByText('Hover me');
      fireEvent.mouseEnter(trigger);

      expect(screen.queryByText('Tooltip text')).toBeNull();
    });
  });
});
