import React, { useCallback, useRef } from 'react';

import {
  Image,
  KeyboardAvoidingView,
  Platform,
  View,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';

import Icon from 'react-native-vector-icons/Feather';
import ImagePicker from 'react-native-image-picker';

import { useNavigation } from '@react-navigation/native';
import { Form } from '@unform/mobile';
import { FormHandles } from '@unform/core';

import * as Yup from 'yup';
import { useAuth } from '../../hooks/auth';

import api from '../../services/api';

import Button from '../../components/Button';
import Input from '../../components/Input';

import getValidationErrors from '../../utils/getValidationErrors';

import {
  Container,
  Title,
  UserAvatarButton,
  UserAvatar,
  BackButton,
  ButtonSignOut,
  ButtonSignOutText,
} from './styles';

interface ProfileFormData {
  name: string;
  password: string;
  email: string;
  old_password?: string;
  password_confirmation?: string;
}

const Profile: React.FC = () => {
  const { user, updateUser, signOut } = useAuth();

  const navigation = useNavigation();

  const formRef = useRef<FormHandles>(null);

  const passwordInputRef = useRef<TextInput>(null);
  const oldPasswordInputRef = useRef<TextInput>(null);
  const confirmationPasswordInputRef = useRef<TextInput>(null);

  const emailInputRef = useRef<TextInput>(null);

  const handleUpdate = useCallback(
    async (data: ProfileFormData) => {
      try {
        formRef.current?.setErrors({});

        const schema = Yup.object().shape({
          email: Yup.string()
            .required('E-mail Obrigatório')
            .email('Digite um e-mail válido'),
          old_password: Yup.string(),
          password: Yup.string().when('old_password', {
            is: val => !!val.length,
            then: Yup.string().required('O campo é obrigatório'),
            otherwise: Yup.string(),
          }),
          password_confirmation: Yup.string()
            .when('old_password', {
              is: val => !!val.length,
              then: Yup.string().required('O campo é obrigatório'),
              otherwise: Yup.string(),
            })
            .oneOf([Yup.ref('password'), null], 'Confirmaçao invalida'),
        });

        await schema.validate(data, {
          abortEarly: false,
        });

        const formData = {
          name: data.name,
          email: data.email,
          ...(data.old_password
            ? {
              old_password: data.old_password,
              password: data.password,
              password_confirmation: data.password_confirmation,
            }
            : {}),
        };

        const response = await api.put('/profile', formData);
        updateUser(response.data);

        Alert.alert(
          'Perfil atualizado com sucesso!',
          'Seu perfil foi atualizado com sucesso',
        );
        navigation.goBack();
      } catch (err) {
        if (err instanceof Yup.ValidationError) {
          const errors = getValidationErrors(err);

          formRef.current?.setErrors(errors);
        }

        Alert.alert(
          'Erro na atualização do perfil',
          'Não foi possivel atualizar seu perfil',
        );
      }
    },
    [navigation, updateUser],
  );

  const handleUpdateAvatar = useCallback(() => {
    ImagePicker.showImagePicker(
      {
        title: 'Selecione um avatar',
        cancelButtonTitle: 'Cancelar',
        takePhotoButtonTitle: 'Usar câmera',
      },

      response => {
        if (response.didCancel) {
          return;
        }

        if (response.error) {
          Alert.alert('Erro ao atualizar seu avatar');
          return;
        }

        // You can also display the image using data:

        const data = new FormData();

        data.append('avatar', {
          type: 'image/jpeg',
          name: `${user.id}.jpg`,
          uri: response.uri,
        });

        api
          .patch('users/avatar', data)
          .then(responseUser => updateUser(responseUser.data));
      },
    );
  }, [user.id, updateUser]);

  return (
    <ScrollView>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        enabled
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flex: 1 }}
        >
          <Container>
            <BackButton onPress={navigation.goBack}>
              <Icon name="chevron-left" size={24} color="#999591" />
            </BackButton>

            <UserAvatarButton onPress={handleUpdateAvatar}>
              <UserAvatar source={{ uri: user.avatar_url }} />
            </UserAvatarButton>

            <View>
              <Title>Meu perfil</Title>
            </View>

            <Form initialData={user} onSubmit={handleUpdate} ref={formRef}>
              <Input
                name="name"
                icon="user"
                placeholder="Digite seu nome"
                returnKeyType="next"
                autoCapitalize="words"
                onSubmitEditing={() => {
                  emailInputRef.current?.focus();
                }}
              />

              <Input
                ref={emailInputRef}
                name="email"
                icon="mail"
                autoCorrect={false}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="Digite seu email"
                returnKeyType="next"
                onSubmitEditing={() => {
                  oldPasswordInputRef.current?.focus();
                }}
              />

              <Input
                ref={oldPasswordInputRef}
                containerStyle={{ marginTop: 16 }}
                name="old_password"
                icon="lock"
                secureTextEntry
                placeholder="Senha atual"
                textContentType="oneTimeCode"
                returnKeyType="next"
                onSubmitEditing={() => {
                  passwordInputRef.current?.focus();
                }}
              />

              <Input
                ref={passwordInputRef}
                name="password"
                icon="lock"
                secureTextEntry
                placeholder="Nova senha"
                textContentType="oneTimeCode"
                returnKeyType="next"
                onSubmitEditing={() => {
                  confirmationPasswordInputRef.current?.focus();
                }}
              />

              <Input
                ref={confirmationPasswordInputRef}
                name="password_confirmation"
                icon="lock"
                secureTextEntry
                placeholder="Confirmar senha"
                textContentType="oneTimeCode"
                returnKeyType="send"
                onSubmitEditing={() => {
                  formRef.current?.submitForm();
                }}
              />
              <Button
                onPress={() => {
                  formRef.current?.submitForm();
                }}
              >
                Confirmar mudanças
              </Button>

              <ButtonSignOut onPress={signOut}>
                <ButtonSignOutText>Sair</ButtonSignOutText>
                <Icon name="log-out" size={18} color="#f4ede8" />
              </ButtonSignOut>
            </Form>
          </Container>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScrollView>
  );
};

export default Profile;
