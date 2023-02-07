import { useAppDispatch, useAppSelector } from '@hooks/use-store';
import { clearCart } from '@redux/card/index';
import ArrowLeft from '@store/assets/icons/arrow-left';
import Button from '@store/components/button';
import Input from '@store/components/input';
import Textarea from '@store/components/textarea';
import { DrawerContext } from '@store/contexts/drawer/drawer.provider';
import { ProductType } from '@ts-types/generated';
import { useContext, useState } from 'react';

import OrderSubmit from './order-submit';

const initialState = {
  phoneNumber: '',
  fullName: '',
  address: '',
  city: ''
};

export default function Checkout() {
  const { dispatch } = useContext(DrawerContext);
  const [formData, setFormData] = useState(initialState);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const cartDispatch = useAppDispatch();
  const items = useAppSelector((state) => state.cart.items);

  const hideCheckout = () => {
    dispatch({
      type: 'TOGGLE_CHECKOUT_VIEW',
      payload: {
        showCheckout: false
      }
    });
  };

  const submitOrder = async () => {
    const { phoneNumber } = formData;
    if (!phoneNumber.trim()) {
      setError({
        field: 'phoneNumber',
        message: 'Phone number is required'
      });
      return;
    }

    console.log({ formData });

    setLoading(true);

    const res = await fetch('/api/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shippingInfo: formData,
        items: items?.map((item) => {
          const price =
            item?.type?.id === ProductType.Simple
              ? item?.salePrice
              : item?.orderVariationOption?.salePrice;
          return {
            product_id: item?.id,
            price,
            quantity: item?.orderQuantity,
            orderVariationOption: { id: item?.orderVariationOption?.id }
          };
        })
      })
    });
    if (res.status === 200) {
      setSuccess(true);
      cartDispatch(clearCart());
      setLoading(false);
    } else {
      setError(true);
      setLoading(false);
    }
  };

  const onChange = (e) => {
    const { value, name } = e.currentTarget;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  if (success) {
    return <OrderSubmit />;
  }

  return (
    <div className="flex flex-col w-full h-full">
      <div className="w-full flex justify-center relative px-30px py-20px">
        <button
          className="w-auto h-10 flex items-center justify-center text-gray-500 absolute top-half -mt-20px left-30px transition duration-300 focus:outline-none hover:text-gray-900"
          onClick={hideCheckout}
          aria-label="close"
        >
          <ArrowLeft />
        </button>
        <h2 className="font-bold text-24px m-0">Checkout</h2>
      </div>

      <div className="flex-grow h-full">
        <div className="flex flex-col px-30px pt-20px h-full placeholder-gray-400">
          <div className="flex flex-col mb-45px">
            <span className="flex font-semibold text-gray-900 text-18px mb-15px">
              Contact Information
            </span>
            <Input
              placeholder="Full Name"
              className="mb-10px border border-gray-400 placeholder:text-gray-400"
              name="fullName"
              value={formData.fullName}
              onChange={onChange}
            />
            <Input
              placeholder="Phone Number"
              className="mb-10px border border-gray-400 placeholder:text-gray-400"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={onChange}
            />
            {error?.field === 'phoneNumber' && (
              <p className="text-12px font-semibold text-error pt-10px pl-15px">
                {error.message}
              </p>
            )}
          </div>

          <div className="flex flex-col h-full">
            <span className="flex font-semibold text-gray-900 text-18px mb-15px">
              Shipping Address
            </span>
            <Textarea
              placeholder="Address"
              className="mb-10px border border-gray-400 placeholder:text-gray-400 h-max"
              name="address"
              rows={2}
              value={formData.address}
              onChange={onChange}
            ></Textarea>
            <Input
              placeholder="City"
              name="city"
              value={formData.city}
              onChange={onChange}
              className="border border-gray-400 placeholder:text-gray-400"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col p-30px">
        <Button className="big w-full" onClick={submitOrder} loading={loading}>
          Order Now
        </Button>
      </div>
    </div>
  );
}
