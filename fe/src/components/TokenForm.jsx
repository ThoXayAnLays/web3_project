// src/components/TokenForm.jsx
import React from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

const TokenForm = ({ onSubmit, action }) => {
    const validationSchema = Yup.object().shape({
        amount: Yup.number()
            .positive('Amount must be positive')
            .required('Amount is required'),
    });

    return (
        <Formik
            initialValues={{ amount: '' }}
            validationSchema={validationSchema}
            onSubmit={onSubmit}
        >
            {({ isSubmitting }) => (
                <Form>
                    <Field type="number" name="amount" placeholder="Amount" />
                    <ErrorMessage name="amount" component="div" className="error" />
                    <button type="submit" disabled={isSubmitting}>
                        {action}
                    </button>
                </Form>
            )}
        </Formik>
    );
};

export default TokenForm;