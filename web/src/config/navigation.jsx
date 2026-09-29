import {
  BoltIcon,
  CalendarDaysIcon,
  ChartBarSquareIcon,
  LockClosedIcon,
  MapPinIcon,
  Squares2X2Icon,
  SunIcon,
  UserCircleIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

const accountItems = [
  { name: 'My Profile', path: '/account/profile', icon: UserCircleIcon },
  { name: 'Security', path: '/account/security', icon: LockClosedIcon },
];

export const navigationByRole = {
  Backoffice: [
    { name: 'Overview', path: '/backoffice', icon: Squares2X2Icon, end: true },
    { name: 'Staff Accounts', path: '/backoffice/staff', icon: UserGroupIcon },
    { name: 'Prosumers', path: '/backoffice/prosumers', icon: SunIcon },
    { name: 'Microgrid Nodes', path: '/backoffice/stations', icon: MapPinIcon },
    { name: 'Energy Slots', path: '/backoffice/slots', icon: BoltIcon },
    { name: 'Reservations', path: '/backoffice/reservations', icon: CalendarDaysIcon },
    ...accountItems,
  ],
  GridOperator: [
    { name: 'Overview', path: '/grid-operator', icon: ChartBarSquareIcon, end: true },
    { name: 'Stations', path: '/grid-operator/stations', icon: MapPinIcon },
    { name: 'Slots', path: '/grid-operator/slots', icon: BoltIcon },
    { name: 'Reservations', path: '/grid-operator/reservations', icon: CalendarDaysIcon },
    ...accountItems,
  ],
  Prosumer: [
    { name: 'Account Home', path: '/prosumer', icon: Squares2X2Icon, end: true },
    ...accountItems,
  ],
};
